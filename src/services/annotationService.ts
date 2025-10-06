import { supabase } from '../lib/supabase';

export interface Annotation {
  id: string;
  documentId: string;
  pageNumber?: number;
  annotationType: 'highlight' | 'comment' | 'note' | 'drawing';
  content: string;
  position: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    path?: string;
  };
  color: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createAnnotation(params: {
  documentId: string;
  pageNumber?: number;
  annotationType: 'highlight' | 'comment' | 'note' | 'drawing';
  content: string;
  position: any;
  color?: string;
}): Promise<{ success: boolean; annotation?: Annotation; error?: string }> {
  try {
    const { documentId, pageNumber, annotationType, content, position, color } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: annotation, error: insertError } = await supabase
      .from('document_annotations')
      .insert({
        document_id: documentId,
        page_number: pageNumber,
        annotation_type: annotationType,
        content,
        position,
        color: color || '#FFEB3B',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      annotation: {
        id: annotation.id,
        documentId: annotation.document_id,
        pageNumber: annotation.page_number,
        annotationType: annotation.annotation_type as any,
        content: annotation.content,
        position: annotation.position,
        color: annotation.color,
        createdBy: annotation.created_by,
        createdAt: new Date(annotation.created_at),
        updatedAt: new Date(annotation.updated_at),
      },
    };
  } catch (error) {
    console.error('Error creating annotation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDocumentAnnotations(documentId: string) {
  const { data, error } = await supabase
    .from('document_annotations')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  return { data, error };
}

export async function updateAnnotation(annotationId: string, updates: {
  content?: string;
  position?: any;
  color?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_annotations')
      .update(updates)
      .eq('id', annotationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating annotation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteAnnotation(annotationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_annotations')
      .delete()
      .eq('id', annotationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
