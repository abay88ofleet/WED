import { supabase } from '../lib/supabase';

/**
 * Simplified version of checkDuplicateFile that bypasses query builder issues
 */
export async function checkDuplicateFile(fileHash: string, userId: string): Promise<{ isDuplicate: boolean; existingDocId?: string; fileName?: string }> {
  try {
    // Use the most basic query possible - just get all documents and filter in memory
    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, file_hash, uploaded_by');
    
    if (error) {
      console.error('Duplicate check query failed:', error);
      throw new Error('Database query failed: ' + error.message);
    }
    
    if (!data) {
      return { isDuplicate: false };
    }
    
    // Filter in memory to find duplicates
    const existingDoc = data.find((doc: any) => 
      doc.file_hash === fileHash && doc.uploaded_by === userId
    );
    
    if (existingDoc) {
      return {
        isDuplicate: true,
        existingDocId: existingDoc.id,
        fileName: existingDoc.file_name,
      };
    }
    
    return { isDuplicate: false };
    
  } catch (error) {
    console.error('Duplicate check failed:', error);
    // Don't throw error for duplicate check - allow upload to continue
    return { isDuplicate: false };
  }
}

