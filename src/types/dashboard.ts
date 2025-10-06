export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  order: number;
  isVisible: boolean;
}

export type WidgetType =
  | 'storage'
  | 'quick-stats'
  | 'recent-activity'
  | 'quick-actions'
  | 'favorites'
  | 'analytics'
  | 'shared-with-me'
  | 'recent-documents';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface StorageMetrics {
  used: number;
  total: number;
  percentage: number;
  trend: number;
  breakdown: {
    type: string;
    size: number;
    percentage: number;
    color: string;
  }[];
}

export interface QuickStat {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  onClick?: () => void;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'edit' | 'share' | 'delete' | 'view' | 'download';
  description: string;
  documentTitle: string;
  documentId: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
}

export interface DashboardPreferences {
  userId: string;
  widgetLayout: DashboardWidget[];
  theme: 'light' | 'dark';
  defaultView: 'dashboard' | 'documents';
  recentActivityLimit: number;
}
