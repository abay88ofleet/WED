import React, { useState } from 'react';
import { Settings, User, FolderTree, Bell, Shield, LogOut, Users, Activity, Link2, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CategoryManagementModal } from '../components/CategoryManagementModal';
import { UserManagementSection } from '../components/settings/UserManagementSection';
import { AuditLogsSection } from '../components/settings/AuditLogsSection';
import { IntegrationsSection } from '../components/settings/IntegrationsSection';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your account information',
      items: [
        { label: 'Email', value: user?.email || 'Not set' },
        { label: 'User ID', value: user?.id || 'Not set' },
        { label: 'Account Created', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown' },
      ],
    },
    {
      id: 'categories',
      title: 'Category Management',
      icon: FolderTree,
      description: 'Create and organize document categories',
      action: {
        label: 'Manage Categories',
        onClick: () => setIsCategoryModalOpen(true),
      },
    },
    {
      id: 'users',
      title: 'User Management',
      icon: Users,
      description: 'Manage user accounts and roles',
      component: UserManagementSection,
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      icon: Activity,
      description: 'View system activity and audit trail',
      component: AuditLogsSection,
    },
    {
      id: 'integrations',
      title: 'System Integrations',
      icon: Link2,
      description: 'Connect with external systems',
      component: IntegrationsSection,
    },
    {
      id: 'storage',
      title: 'Storage Management',
      icon: Database,
      description: 'Monitor and manage storage usage',
      items: [
        { label: 'Storage Used', value: '2.4 GB / 100 GB' },
        { label: 'Documents', value: '1,247' },
        { label: 'Largest Document', value: '45 MB' },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Configure notification preferences',
      items: [
        { label: 'Email notifications', value: 'Enabled' },
        { label: 'Upload notifications', value: 'Enabled' },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      description: 'Manage security settings',
      items: [
        { label: 'Two-factor authentication', value: 'Not configured' },
        { label: 'Active sessions', value: '1' },
      ],
    },
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account and system preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">
                          {section.title}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    {section.action && (
                      <button
                        onClick={section.action.onClick}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        {section.action.label}
                      </button>
                    )}
                  </div>
                </div>

                {section.component && (
                  <div className="p-4">
                    <section.component />
                  </div>
                )}

                {section.items && (
                  <div className="p-4">
                    <dl className="space-y-2.5">
                      {section.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <dt className="text-xs font-medium text-gray-700">
                            {item.label}
                          </dt>
                          <dd className="text-xs text-gray-900">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Sign Out</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <CategoryManagementModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      </div>
    </div>
  );
};
