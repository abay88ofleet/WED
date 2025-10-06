import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { usePerformanceMetrics, useMetricsSummary } from '../../hooks/usePerformanceMetrics';
import { queryMonitor } from '../../services/queryMonitor';
import { monitoringService } from '../../services/monitoringService';

interface PerformanceWidgetProps {
  className?: string;
}

export function PerformanceWidget({ className = '' }: PerformanceWidgetProps) {
  const metrics = usePerformanceMetrics();
  const metricsSummary = useMetricsSummary();
  const [queryStats, setQueryStats] = useState({
    totalQueries: 0,
    averageDuration: 0,
    slowQueries: 0,
    failedQueries: 0,
  });

  useEffect(() => {
    const updateQueryStats = () => {
      const slowQueries = queryMonitor.getSlowQueries();
      const failedQueries = queryMonitor.getFailedQueries();
      const querySummary = monitoringService.getQueryMetricsSummary();

      setQueryStats({
        totalQueries: querySummary.totalQueries,
        averageDuration: querySummary.averageDuration,
        slowQueries: slowQueries.length,
        failedQueries: failedQueries.length,
      });
    };

    updateQueryStats();
    const interval = setInterval(updateQueryStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4" />;
    if (score >= 70) return <Activity className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const calculatePerformanceScore = (): number => {
    let score = 100;

    if (metrics.fcp > 1800) score -= 20;
    else if (metrics.fcp > 1000) score -= 10;

    if (metrics.lcp > 2500) score -= 20;
    else if (metrics.lcp > 1500) score -= 10;

    if (metrics.cls > 0.25) score -= 20;
    else if (metrics.cls > 0.1) score -= 10;

    if (metrics.fid > 100) score -= 20;
    else if (metrics.fid > 50) score -= 10;

    if (queryStats.averageDuration > 500) score -= 10;
    if (queryStats.slowQueries > 0) score -= 5;
    if (queryStats.failedQueries > 0) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const performanceScore = calculatePerformanceScore();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        </div>
        <div className={`flex items-center gap-2 ${getScoreColor(performanceScore)}`}>
          {getScoreIcon(performanceScore)}
          <span className="text-2xl font-bold">{performanceScore}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="FCP"
              value={metrics.fcp.toFixed(0)}
              unit="ms"
              threshold={1800}
              good={1000}
            />
            <MetricCard
              label="LCP"
              value={metrics.lcp.toFixed(0)}
              unit="ms"
              threshold={2500}
              good={1500}
            />
            <MetricCard
              label="FID"
              value={metrics.fid.toFixed(0)}
              unit="ms"
              threshold={100}
              good={50}
            />
            <MetricCard
              label="CLS"
              value={metrics.cls.toFixed(3)}
              unit=""
              threshold={0.25}
              good={0.1}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Database Performance</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Total Queries</div>
              <div className="text-lg font-semibold text-gray-900">{queryStats.totalQueries}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Avg Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {queryStats.averageDuration.toFixed(0)}ms
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Slow Queries</div>
              <div className={`text-lg font-semibold ${queryStats.slowQueries > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {queryStats.slowQueries}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Failed Queries</div>
              <div className={`text-lg font-semibold ${queryStats.failedQueries > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {queryStats.failedQueries}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">System Resources</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Memory Usage</div>
              <div className="text-lg font-semibold text-gray-900">
                {metrics.memoryUsage.toFixed(0)} MB
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Connection</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {metrics.connectionSpeed}
              </div>
            </div>
          </div>
        </div>

        {metricsSummary.totalMetrics > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Captured Metrics</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Total Metrics Recorded</div>
              <div className="text-lg font-semibold text-gray-900">
                {metricsSummary.totalMetrics}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  threshold: number;
  good: number;
}

function MetricCard({ label, value, unit, threshold, good }: MetricCardProps) {
  const numValue = parseFloat(value);
  const status = numValue === 0 ? 'unknown' : numValue <= good ? 'good' : numValue <= threshold ? 'needs-improvement' : 'poor';

  const statusColors = {
    good: 'bg-green-50 border-green-200',
    'needs-improvement': 'bg-yellow-50 border-yellow-200',
    poor: 'bg-red-50 border-red-200',
    unknown: 'bg-gray-50 border-gray-200',
  };

  const textColors = {
    good: 'text-green-700',
    'needs-improvement': 'text-yellow-700',
    poor: 'text-red-700',
    unknown: 'text-gray-700',
  };

  const icons = {
    good: <TrendingUp className="w-3 h-3" />,
    'needs-improvement': <Activity className="w-3 h-3" />,
    poor: <TrendingDown className="w-3 h-3" />,
    unknown: <Activity className="w-3 h-3" />,
  };

  return (
    <div className={`rounded-lg p-3 border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-600">{label}</div>
        <div className={textColors[status]}>
          {icons[status]}
        </div>
      </div>
      <div className={`text-lg font-semibold ${textColors[status]}`}>
        {value === '0' ? '-' : `${value}${unit}`}
      </div>
    </div>
  );
}
