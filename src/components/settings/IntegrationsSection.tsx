import React from 'react';
import { Link2, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export const IntegrationsSection: React.FC = () => {
  const integrations: Integration[] = [
    {
      id: 'hr-system',
      name: 'HR Management System',
      description: 'Sync employee documents and records',
      icon: '👥',
      status: 'connected',
      lastSync: '2 hours ago',
    },
    {
      id: 'finance-system',
      name: 'Finance & Accounting',
      description: 'Import financial reports and invoices',
      icon: '💰',
      status: 'connected',
      lastSync: '5 minutes ago',
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      description: 'Connect to SharePoint document libraries',
      icon: '📊',
      status: 'disconnected',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Import documents from Google Drive',
      icon: '📁',
      status: 'disconnected',
    },
  ];

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Integrations</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Link2 className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{integration.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                </div>
              </div>
              {getStatusIcon(integration.status)}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(integration.status)}`}>
                  {getStatusText(integration.status)}
                </span>
                {integration.lastSync && (
                  <span className="text-xs text-gray-500">
                    • Last sync {integration.lastSync}
                  </span>
                )}
              </div>
              <button className="p-1 hover:bg-gray-100 rounded">
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
