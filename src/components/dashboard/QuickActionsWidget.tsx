import React from 'react';
import { Upload, Search, Settings, FolderOpen, FileText, Share2 } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

interface QuickActionsWidgetProps {
  onUpload: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onBrowse: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onUpload,
  onSearch,
  onSettings,
  onBrowse,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'upload',
      label: 'Upload Files',
      icon: Upload,
      color: 'blue',
      onClick: onUpload,
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: FolderOpen,
      color: 'green',
      onClick: onBrowse,
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      color: 'purple',
      onClick: onSearch,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'gray',
      onClick: onSettings,
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; hover: string; text: string }> = {
      blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-500' },
      green: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-500' },
      purple: { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-500' },
      gray: { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', text: 'text-gray-500' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <DashboardWidget title="Quick Actions" icon={FileText} iconColor="text-purple-500">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const colors = getColorClasses(action.color);
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            >
              <div
                className={`p-4 ${colors.bg} ${colors.hover} rounded-full transition-all duration-200 group-hover:scale-110`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </DashboardWidget>
  );
};
