import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const userRoleService = {
  async getUserRole(userId: string): Promise<UserRoleRecord | null> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllUserRoles(): Promise<UserRoleRecord[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async setUserRole(
    userId: string,
    role: UserRole,
    permissions: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        permissions,
      });

    if (error) throw error;
  },

  async deleteUserRole(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};
