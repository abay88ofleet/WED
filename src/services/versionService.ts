import { supabase } from '../lib/supabase';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  filePath: string;
  fileSize: number;
  fileHash: string;
  changesDescription: string;
  createdBy: string;
  createdAt: Date;
}

export async function createDocumentVersion(params: {
  documentId: string;
  file: File;
  changesDescription: string;
}): Promise<{ success: boolean; version?: DocumentVersion; error?: string }> {
  try {
    const { documentId, file, changesDescription } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: existingVersions } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_number + 1
      : 1;

    const { generateFileHash } = await import('./uploadService');
    const fileHash = await generateFileHash(file);

    const filePath = `${user.id}/versions/${documentId}/v${nextVersionNumber}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: version, error: insertError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersionNumber,
        file_path: filePath,
        file_size: file.size,
        file_hash: fileHash,
        changes_description: changesDescription,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      version: {
        id: version.id,
        documentId: version.document_id,
        versionNumber: version.version_number,
        filePath: version.file_path,
        fileSize: version.file_size,
        fileHash: version.file_hash,
        changesDescription: version.changes_description,
        createdBy: version.created_by,
        createdAt: new Date(version.created_at),
      },
    };
  } catch (error) {
    console.error('Error creating document version:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDocumentVersions(documentId: string) {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  return { data, error };
}

export async function getVersionUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    console.error('Error creating signed URL:', error);
    return '';
  }

  return data.signedUrl;
}

export async function restoreVersion(versionId: string, documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: version } = await supabase
      .from('document_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (!version) {
      return { success: false, error: 'Version not found' };
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        file_path: version.file_path,
        file_size: version.file_size,
        file_hash: version.file_hash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error restoring version:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
