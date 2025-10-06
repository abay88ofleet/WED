import { supabase } from '../lib/supabase';

export interface CreateCategoryParams {
  name: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}

export interface UpdateCategoryParams {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}

export async function createCategory(params: CreateCategoryParams) {
  try {
    console.log('createCategory: Starting with params:', params);
    const { name, icon = 'Folder', color = '#3B82F6', parentId = null } = params;

    // Step 1: Insert the category (without chained select)
    const { error: insertError } = await supabase
      .from('categories')
      .insert({
        name,
        icon,
        color,
        parent_id: parentId,
      });

    if (insertError) {
      console.error('createCategory: Insert error:', insertError);
      return { data: null, error: insertError };
    }

    // Step 2: Get the created category (separate query)
    const { data, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      console.warn('createCategory: Select error (category created but could not retrieve):', selectError);
      // Category was created successfully, but we couldn't retrieve it
      return { data: null, error: null }; // Return success since insert worked
    }

    console.log('createCategory: Success');
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('createCategory: Exception:', error);
    return { data: null, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function updateCategory(categoryId: string, params: UpdateCategoryParams) {
  try {
    console.log('updateCategory: Starting with ID:', categoryId, 'params:', params);
    
    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.icon !== undefined) updateData.icon = params.icon;
    if (params.color !== undefined) updateData.color = params.color;
    if (params.parentId !== undefined) updateData.parent_id = params.parentId;

    // Step 1: Update the category (without chained select)
    const { error: updateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryId);

    if (updateError) {
      console.error('updateCategory: Update error:', updateError);
      return { data: null, error: updateError };
    }

    // Step 2: Get the updated category (separate query)
    const { data, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .limit(1);

    if (selectError) {
      console.warn('updateCategory: Select error (category updated but could not retrieve):', selectError);
      // Category was updated successfully, but we couldn't retrieve it
      return { data: null, error: null }; // Return success since update worked
    }

    console.log('updateCategory: Success');
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('updateCategory: Exception:', error);
    return { data: null, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    console.log('deleteCategory: Starting with ID:', categoryId);
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('deleteCategory: Delete error:', error);
      return { error };
    }

    console.log('deleteCategory: Success');
    return { error: null };
  } catch (error) {
    console.error('deleteCategory: Exception:', error);
    return { error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function getCategoryDocumentCount(categoryId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .eq('category_id', categoryId);

    if (error) {
      return { count: 0, error };
    }

    return { count: data?.length || 0, error: null };
  } catch (error) {
    return { count: 0, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function pinCategory(categoryId: string, isPinned: boolean) {
  try {
    const { error: updateError } = await supabase
      .from('categories')
      .update({ is_pinned: isPinned })
      .eq('id', categoryId);

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Get updated category
    const { data, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .limit(1);

    return { data: data?.[0] || null, error: selectError };
  } catch (error) {
    return { data: null, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function reorderCategories(updates: Array<{ id: string; sortOrder: number }>) {
  try {
    const errors = [];
    
    for (const { id, sortOrder } of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: sortOrder })
        .eq('id', id);
      
      if (error) {
        errors.push(error);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    return { success: false, errors: [error instanceof Error ? { message: error.message } : { message: 'Unknown error' }] };
  }
}

export async function getCategoryTree(parentId: string | null = null) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) return { data: null, error };

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

    const buildTree = (items: any[], parent: string | null): any[] => {
      return items
        .filter((item) => item.parent_id === parent)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    const tree = buildTree(sortedData || [], parentId);
    return { data: tree, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}

export async function moveCategoryToParent(
  categoryId: string,
  newParentId: string | null
) {
  try {
    const checkForCycle = async (id: string, targetParentId: string | null): Promise<boolean> => {
      if (targetParentId === null) return false;
      if (id === targetParentId) return true;

      const { data } = await supabase
        .from('categories')
        .select('parent_id')
        .eq('id', targetParentId);

      const parentRecord = data?.[0];
      if (!parentRecord || !parentRecord.parent_id) return false;
      return checkForCycle(id, parentRecord.parent_id);
    };

    const wouldCreateCycle = await checkForCycle(categoryId, newParentId);
    if (wouldCreateCycle) {
      return { data: null, error: { message: 'Cannot move category: would create a cycle' } };
    }

    const { error: updateError } = await supabase
      .from('categories')
      .update({ parent_id: newParentId })
      .eq('id', categoryId);

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Get updated category
    const { data, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .limit(1);

    return { data: data?.[0] || null, error: selectError };
  } catch (error) {
    return { data: null, error: error instanceof Error ? { message: error.message } : { message: 'Unknown error' } };
  }
}
