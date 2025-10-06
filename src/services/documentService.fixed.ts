import { supabase } from '../lib/supabase';
import { generateFileHash, extractMetadataAndTags } from './uploadService';
import { checkDuplicateFile } from './uploadService.fixed';
import { createAuditLog, AUDIT_ACTIONS } from './auditService';

export interface UploadDocumentParams {
  file: File;
  categoryId: string;
  tags: string[];
  description?: string;
  isSoftCopyTemplate?: boolean;
}

/**
 * Fixed version of getCategories that handles query builder issues
 */
export async function getCategories() {
  try {
    // Use simple query without chaining
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('Error loading categories:', error);
      return { data: null, error: error.message };
    }

    // Sort in memory to handle multiple sort criteria
    const sortedData = data?.sort((a, b) => {
      // First sort by is_pinned (pinned items first)
      if (a.is_pinned !== b.is_pinned) {
        return b.is_pinned ? 1 : -1;
      }
      // Then by sort_order
      if (a.sort_order !== b.sort_order) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      // Finally by name
      return (a.name || '').localeCompare(b.name || '');
    });

    return { data: sortedData || [], error: null };
  } catch (error) {
    console.error('getCategories exception:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fixed version of getDocuments that handles query builder issues
 */
export async function getDocuments() {
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return { data: null, error: `Authentication failed: ${authError.message}` };
    }
    
    if (!user) {
      console.error('User not authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    // Use simple query approach - get all documents first, then filter and join manually
    const { data: documentsData, error: docsError } = await supabase
      .from('documents')
      .select('*');
    
    if (docsError) {
      console.error('Documents query error:', docsError);
      return { data: null, error: docsError.message || 'Failed to fetch documents' };
    }

    // Filter documents by user
    const userDocuments = documentsData?.filter(doc => doc.uploaded_by === user.id) || [];

    // Get categories separately
    const { data: categoriesData, error: catsError } = await supabase
      .from('categories')
      .select('*');

    if (catsError) {
      console.warn('Categories query error:', catsError);
    }

    // Join documents with categories manually
    const documentsWithCategories = userDocuments.map(doc => ({
      ...doc,
      category: categoriesData?.find(cat => cat.id === doc.category_id) || null
    }));

    // Sort by upload date (newest first)
    documentsWithCategories.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    return { data: documentsWithCategories, error: null };
    
  } catch (error) {
    console.error('getDocuments exception:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Fixed version of uploadDocument that handles query builder issues
 */
export async function uploadDocument(params: UploadDocumentParams): Promise<{ success: boolean; documentId?: string; error?: string; existingDocId?: string }> {
  try {
    const { file, categoryId, tags, description = '', isSoftCopyTemplate = false } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const fileHash = await generateFileHash(file);
    const duplicateCheck = await checkDuplicateFile(fileHash, user.id);

    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: `Document with identical content already exists as "${duplicateCheck.fileName}". Use a different name to create a copy.`,
        existingDocId: duplicateCheck.existingDocId
      };
    }

    const filePath = `${user.id}/${fileHash}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { metadata: extractedMetadata, ocrText } = await extractMetadataAndTags(file);
    const title = file.name.replace(/\.[^/.]+$/, '');
    const documentData = {
      title,
      description,
      file_name: file.name,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file_path: filePath,
      file_hash: fileHash,
      category_id: categoryId || null,
      tags,
      uploaded_by: user.id,
      ocr_text: ocrText,
      metadata: extractedMetadata || {},
      is_soft_copy_template: isSoftCopyTemplate,
      is_downloadable_only: isSoftCopyTemplate,
    };

    // First, insert the document
    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(documentData);

    if (insertError) {
      console.error('Document insert error:', insertError);
      // Clean up the uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: insertError.message };
    }

    // Get the inserted document by finding it with unique identifiers
    const { data: documents, error: selectError } = await SafeSupabaseQuery.selectDocuments(
      { file_hash: fileHash, uploaded_by: user.id }, 
      'id, uploaded_at'
    );
    
    if (selectError) {
      console.error('Failed to query database after upload:', selectError);
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: 'Failed to query database: ' + selectError.message };
    }
    
    if (!documents || documents.length === 0) {
      console.error('Could not find inserted document');
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: 'Failed to retrieve inserted document' };
    }
    
    // Get the most recent document (by uploaded_at)
    const newDocument = documents.sort((a, b) => 
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0];
    
    const documentId = newDocument.id;
    await createAuditLog({
      action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
      resourceType: 'document',
      resourceId: documentId,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        categoryId,
        tags,
      },
    });

    return { success: true, documentId };
  } catch (error) {
    console.error('uploadDocument exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fixed version of deleteDocument
 */
export async function deleteDocument(documentId: string) {
  try {
    // Get document info first using SafeSupabaseQuery
    const { data: documents, error: selectError } = await SafeSupabaseQuery.selectDocuments(
      { id: documentId }, 
      'id, file_path, file_name'
    );

    if (selectError) {
      return { error: selectError };
    }
    
    if (!documents || documents.length === 0) {
      return { error: { message: 'Document not found' } };
    }

    const document = documents[0];

    if (document?.file_path) {
      await supabase.storage.from('documents').remove([document.file_path]);
    }

    // Use SafeSupabaseQuery for delete operation
    const { error: deleteError } = await SafeSupabaseQuery.deleteDocument(documentId);

    if (!deleteError) {
      await createAuditLog({
        action: AUDIT_ACTIONS.DOCUMENT_DELETE,
        resourceType: 'document',
        resourceId: documentId,
        metadata: {
          fileName: document?.file_name,
        },
      });
    }

    return { error: deleteError };
  } catch (error) {
    console.error('deleteDocument exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fixed version of toggleFavorite
 */
export async function toggleFavorite(documentId: string, isFavorite: boolean) {
  try {
    // Use SafeSupabaseQuery for update operation
    const { error } = await SafeSupabaseQuery.updateDocument(documentId, { is_favorite: isFavorite });

    return { error };
  } catch (error) {
    console.error('toggleFavorite exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function incrementViewCount(documentId: string) {
  const { error } = await supabase.rpc('increment_view_count', {
    document_id: documentId,
  });

  return { error };
}

export async function incrementDownloadCount(documentId: string) {
  const { error } = await supabase.rpc('increment_download_count', {
    document_id: documentId,
  });

  return { error };
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    console.error('Error creating signed URL:', error);
    const { data: publicData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return publicData.publicUrl;
  }

  return data.signedUrl;
}

export async function downloadDocument(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error || !data) {
    throw new Error(error?.message || 'Failed to download document');
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function uploadDocumentCopy(params: UploadDocumentParams & { newFileName: string }): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const { file, categoryId, tags, description = '', newFileName, isSoftCopyTemplate = false } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const fileHash = await generateFileHash(file);
    const timestamp = Date.now();
    const filePath = `${user.id}/${fileHash}-${timestamp}-${newFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { metadata: extractedMetadata, ocrText } = await extractMetadataAndTags(file);

    const title = newFileName.replace(/\.[^/.]+$/, '');

    const documentData = {
      title,
      description,
      file_name: newFileName,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file_path: filePath,
      file_hash: fileHash,
      category_id: categoryId || null,
      tags,
      uploaded_by: user.id,
      ocr_text: ocrText,
      metadata: extractedMetadata || {},
      is_soft_copy_template: isSoftCopyTemplate,
      is_downloadable_only: isSoftCopyTemplate,
    };
    
    // First, insert the document
    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(documentData);

    if (insertError) {
      console.error('uploadDocumentCopy: Insert error:', insertError);
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: insertError.message };
    }

    console.log('uploadDocumentCopy: Retrieving inserted document...');
    // Use simple direct query - NO step-by-step building
    const { data: newDocuments, error: selectError } = await supabase
      .from('documents')
      .select('id')
      .eq('file_path', filePath)
      .order('uploaded_at', { ascending: false })
      .limit(1);
    
    console.log('uploadDocumentCopy: Query executed, error:', selectError, 'dataCount:', newDocuments?.length);
    
    if (selectError || !newDocuments || newDocuments.length === 0) {
      console.error('uploadDocumentCopy: Failed to retrieve inserted document:', selectError);
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: 'Failed to retrieve inserted document' };
    }

    const documentId = newDocuments[0].id;
    console.log('uploadDocumentCopy: Success, document ID:', documentId);
    return { success: true, documentId };
  } catch (error) {
    console.error('Error uploading document copy:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
