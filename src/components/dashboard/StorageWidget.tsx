import React from 'react';
import { HardDrive, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { StorageMetrics } from '../../types/dashboard';

interface StorageWidgetProps {
  metrics: StorageMetrics;
}

export const StorageWidget: React.FC<StorageWidgetProps> = ({ metrics }) => {
  const formatSize = (bytes: number): string => {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (metrics.percentage / 100) * circumference;

  const getStorageColor = () => {
    if (metrics.percentage >= 90) return 'text-red-600';
    if (metrics.percentage >= 75) return 'text-amber-600';
    return 'text-blue-600';
  };

  return (
    <DashboardWidget title="Storage Usage" icon={HardDrive} iconColor="text-blue-500">
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-100"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={getStorageColor()}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getStorageColor()}`}>
              {metrics.percentage}%
            </span>
            <span className="text-xs text-gray-500 mt-1">Used</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatSize(metrics.used)} / {formatSize(metrics.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {metrics.trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className="text-sm text-gray-600">
                {Math.abs(metrics.trend)}% from last week
              </span>
            </div>

            {metrics.breakdown.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-gray-700">By File Type</p>
                {metrics.breakdown.slice(0, 3).map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-600 flex-1">{item.type}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
};
