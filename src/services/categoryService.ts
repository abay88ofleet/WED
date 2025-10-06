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
  const { name, icon = 'Folder', color = '#3B82F6', parentId = null } = params;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      icon,
      color,
      parent_id: parentId,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateCategory(categoryId: string, params: UpdateCategoryParams) {
  const updateData: any = {};

  if (params.name !== undefined) updateData.name = params.name;
  if (params.icon !== undefined) updateData.icon = params.icon;
  if (params.color !== undefined) updateData.color = params.color;
  if (params.parentId !== undefined) updateData.parent_id = params.parentId;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', categoryId)
    .select()
    .single();

  return { data, error };
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  return { error };
}

export async function getCategoryDocumentCount(categoryId: string) {
  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  return { count: count || 0, error };
}

export async function pinCategory(categoryId: string, isPinned: boolean) {
  const { data, error } = await supabase
    .from('categories')
    .update({ is_pinned: isPinned })
    .eq('id', categoryId)
    .select()
    .single();

  return { data, error };
}

export async function reorderCategories(updates: Array<{ id: string; sortOrder: number }>) {
  const promises = updates.map(({ id, sortOrder }) =>
    supabase
      .from('categories')
      .update({ sort_order: sortOrder })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return { success: errors.length === 0, errors };
}

export async function getCategoryTree(parentId: string | null = null) {
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
}

export async function moveCategoryToParent(
  categoryId: string,
  newParentId: string | null
) {
  const checkForCycle = async (id: string, targetParentId: string | null): Promise<boolean> => {
    if (targetParentId === null) return false;
    if (id === targetParentId) return true;

    const { data } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', targetParentId)
      .single();

    if (!data || !data.parent_id) return false;
    return checkForCycle(id, data.parent_id);
  };

  const wouldCreateCycle = await checkForCycle(categoryId, newParentId);
  if (wouldCreateCycle) {
    return { data: null, error: { message: 'Cannot move category: would create a cycle' } };
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ parent_id: newParentId })
    .eq('id', categoryId)
    .select()
    .single();

  return { data, error };
}
