import { supabase } from '../lib/supabase';

/**
 * Safe query utility to handle Supabase query builder issues
 */
export class SafeSupabaseQuery {
  /**
   * Safely select documents with filters applied in memory
   */
  static async selectDocuments(filters?: {
    id?: string;
    file_path?: string;
    file_hash?: string;
    uploaded_by?: string;
  }, columns: string = '*'): Promise<{ data: any[] | null; error: any }> {
    try {
      // Get all documents and filter in memory
      const { data: allData, error } = await supabase
        .from('documents')
        .select(columns);
      
      if (error) {
        return { data: null, error };
      }
      
      if (!allData) {
        return { data: [], error: null };
      }
      
      // Apply filters in memory
      let filteredData = allData;
      
      if (filters) {
        filteredData = allData.filter((item: any) => {
          let matches = true;
          
          // Use strict equality checks with null/undefined safety
          if (filters.id && String(item.id) !== String(filters.id)) matches = false;
          if (filters.file_path && String(item.file_path || '') !== String(filters.file_path || '')) matches = false;
          if (filters.file_hash && String(item.file_hash || '') !== String(filters.file_hash || '')) matches = false;
          if (filters.uploaded_by && String(item.uploaded_by || '') !== String(filters.uploaded_by || '')) matches = false;
          
          return matches;
        });
      }
      
      return { data: filteredData, error: null };
    } catch (error) {
      console.error('SafeSupabaseQuery.selectDocuments failed:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  }
  
  /**
   * Safely update a document using match() instead of eq()
   */
  static async updateDocument(id: string, updates: any): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .match({ id });
      
      return { error };
    } catch (error) {
      console.error('SafeSupabaseQuery.updateDocument failed:', error);
      return { 
        error: { message: error instanceof Error ? error.message : 'Update failed' } 
      };
    }
  }
  
  /**
   * Safely delete a document using match() instead of eq()
   */
  static async deleteDocument(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .match({ id });
      
      return { error };
    } catch (error) {
      console.error('SafeSupabaseQuery.deleteDocument failed:', error);
      return { 
        error: { message: error instanceof Error ? error.message : 'Delete failed' } 
      };
    }
  }
  
  /**
   * Insert a document safely
   */
  static async insertDocument(data: any): Promise<{ data: any; error: any }> {
    try {
      const result = await supabase
        .from('documents')
        .insert(data);
      
      return result;
    } catch (error) {
      console.error('SafeSupabaseQuery.insertDocument failed:', error);
      return { 
        data: null,
        error: { message: error instanceof Error ? error.message : 'Insert failed' } 
      };
    }
  }
}

/**
 * Test function to verify Supabase functionality
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; details: any }> {
  try {
    console.log('Testing Supabase connection and basic operations...');
    
    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (testError) {
      return {
        success: false,
        details: {
          test: 'Basic connection',
          error: testError.message
        }
      };
    }
    
    // Test 2: Documents table access
    const { data: docData, error: docError } = await SafeSupabaseQuery.selectDocuments({}, 'id');
    
    if (docError) {
      return {
        success: false,
        details: {
          test: 'Documents access',
          error: docError.message
        }
      };
    }
    
    return {
      success: true,
      details: {
        categoriesCount: testData?.length || 0,
        documentsCount: docData?.length || 0,
        hasBasicAccess: true
      }
    };
    
  } catch (error) {
    return {
      success: false,
      details: {
        test: 'Connection test',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
