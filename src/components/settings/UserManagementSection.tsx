import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, CreditCard as Edit } from 'lucide-react';
import { userRoleService, UserRoleRecord, UserRole } from '../../services/userRoleService';
import { supabase } from '../../lib/supabase';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role?: UserRole;
}

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const roles = await userRoleService.getAllUserRoles();
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

      const usersWithRoles = (authUsers || []).map(user => ({
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        role: roleMap.get(user.id),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      await userRoleService.setUserRole(userId, role);
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'editor':
        return 'bg-blue-100 text-blue-700';
      case 'viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Users & Roles</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingUser === user.id ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role || 'No role'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingUser === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateRole(user.id, selectedRole)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user.id);
                          setSelectedRole(user.role || 'viewer');
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit role"
                      >
                        <Shield className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
