import React from 'react';
import * as Icons from 'lucide-react';
import { QuickStat } from '../../types/dashboard';

interface QuickStatsWidgetProps {
  stats: QuickStat[];
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({ stats }) => {
  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.FileText;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
      green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'text-gray-500' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = getIconComponent(stat.icon);
        const colors = getColorClasses(stat.color);

        return (
          <button
            key={stat.id}
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className={`bg-white rounded-lg border border-gray-200 p-6 text-left transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
              stat.onClick ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              {stat.trend && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend.isPositive ? (
                    <Icons.TrendingUp className="w-3 h-3" />
                  ) : (
                    <Icons.TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.trend.value)}%
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
