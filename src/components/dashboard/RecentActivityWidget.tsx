import React from 'react';
import { Upload, CreditCard as Edit, Share2, Trash2, Eye, Download, User, Clock } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { ActivityItem } from '../../types/dashboard';

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activities,
  onViewAll,
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconMap = {
      upload: Upload,
      edit: Edit,
      share: Share2,
      delete: Trash2,
      view: Eye,
      download: Download,
    };
    return iconMap[type] || Upload;
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    const colorMap = {
      upload: 'bg-blue-50 text-blue-600',
      edit: 'bg-green-50 text-green-600',
      share: 'bg-purple-50 text-purple-600',
      delete: 'bg-red-50 text-red-600',
      view: 'bg-gray-50 text-gray-600',
      download: 'bg-amber-50 text-amber-600',
    };
    return colorMap[type] || 'bg-gray-50 text-gray-600';
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <DashboardWidget
      title="Recent Activity"
      icon={Clock}
      iconColor="text-green-500"
      action={onViewAll ? { label: 'View All', onClick: onViewAll } : undefined}
    >
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    <span className="text-gray-600">{activity.description}</span>{' '}
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {activity.documentTitle}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>

                {activity.user.avatar ? (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DashboardWidget>
  );
};
