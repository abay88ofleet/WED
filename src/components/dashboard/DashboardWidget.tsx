import React from 'react';
import { Video as LucideIcon } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  icon: Icon,
  iconColor = 'text-gray-400',
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
};
