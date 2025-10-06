import { supabase } from '../lib/supabase';

export interface PerformanceMetric {
  id?: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  metadata?: Record<string, any>;
  user_id?: string;
  created_at?: string;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: {
    pageLoadTime: number;
    ttfb: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    memoryUsage?: number;
    connectionType?: string;
  };
}

export interface QueryPerformanceMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  rowCount?: number;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVitals(entry);
        }
      });

      observer.observe({
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }

  private recordWebVitals(entry: PerformanceEntry): void {
    if (!this.isEnabled) return;

    const metricMap: Record<string, string> = {
      'first-contentful-paint': 'FCP',
      'largest-contentful-paint': 'LCP',
      'first-input': 'FID',
      'layout-shift': 'CLS',
    };

    const metricName = metricMap[entry.entryType];
    if (metricName) {
      this.recordMetric(
        metricName,
        'value' in entry ? (entry as any).value : entry.startTime,
        'ms'
      );
    }
  }

  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      metric_name: name,
      metric_value: value,
      metric_unit: unit,
      metadata: {
        ...metadata,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      created_at: new Date().toISOString(),
    };

    this.metrics.push(metric);

    if (this.metrics.length >= 10) {
      this.flushMetrics();
    }
  }

  async recordQueryPerformance(
    query: string,
    duration: number,
    success: boolean,
    rowCount?: number
  ): Promise<void> {
    const metric: QueryPerformanceMetric = {
      query,
      duration,
      timestamp: Date.now(),
      success,
      rowCount,
    };

    this.queryMetrics.push(metric);

    this.recordMetric('database_query', duration, 'ms', {
      query: query.substring(0, 100),
      success,
      rowCount,
    });
  }

  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: any = null;

    try {
      const result = await operation();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, 'ms', {
        success,
        error: error?.message,
      });
    }
  }

  measureSync<T>(operationName: string, operation: () => T): T {
    const startTime = performance.now();
    let success = true;
    let error: any = null;

    try {
      const result = operation();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, 'ms', {
        success,
        error: error?.message,
      });
    }
  }

  capturePageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
          this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart, 'ms');
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
          this.recordMetric('dom_interactive', navigation.domInteractive - navigation.fetchStart, 'ms');
        }

        if ('memory' in performance && (performance as any).memory) {
          const memory = (performance as any).memory;
          this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
          this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB');
        }

        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          this.recordMetric('network_downlink', connection.downlink, 'Mbps', {
            effectiveType: connection.effectiveType,
            rtt: connection.rtt,
          });
        }
      }, 0);
    });
  }

  getMetricsSummary(): {
    totalMetrics: number;
    averages: Record<string, number>;
    medians: Record<string, number>;
    p95: Record<string, number>;
  } {
    const metricsByName: Record<string, number[]> = {};

    this.metrics.forEach((metric) => {
      if (!metricsByName[metric.metric_name]) {
        metricsByName[metric.metric_name] = [];
      }
      metricsByName[metric.metric_name].push(metric.metric_value);
    });

    const averages: Record<string, number> = {};
    const medians: Record<string, number> = {};
    const p95: Record<string, number> = {};

    Object.entries(metricsByName).forEach(([name, values]) => {
      values.sort((a, b) => a - b);

      averages[name] = values.reduce((a, b) => a + b, 0) / values.length;
      medians[name] = values[Math.floor(values.length / 2)];
      p95[name] = values[Math.floor(values.length * 0.95)];
    });

    return {
      totalMetrics: this.metrics.length,
      averages,
      medians,
      p95,
    };
  }

  getQueryMetricsSummary(): {
    totalQueries: number;
    averageDuration: number;
    successRate: number;
    slowestQueries: QueryPerformanceMetric[];
  } {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        successRate: 0,
        slowestQueries: [],
      };
    }

    const totalDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = this.queryMetrics.filter((m) => m.success).length;
    const slowest = [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalQueries: this.queryMetrics.length,
      averageDuration: totalDuration / this.queryMetrics.length,
      successRate: (successCount / this.queryMetrics.length) * 100,
      slowestQueries: slowest,
    };
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsToSend);

      if (error) {
        console.error('Failed to flush metrics:', error);
        this.metrics.push(...metricsToSend);
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      this.metrics.push(...metricsToSend);
    }
  }

  async forceFlush(): Promise<void> {
    await this.flushMetrics();
  }

  clearMetrics(): void {
    this.metrics = [];
    this.queryMetrics = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  exportMetrics(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      metrics: this.metrics,
      queryMetrics: this.queryMetrics,
      summary: this.getMetricsSummary(),
      querySummary: this.getQueryMetricsSummary(),
    }, null, 2);
  }
}

export const monitoringService = new MonitoringService();

export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    return await monitoringService.measureAsync(operationName, () => fn(...args));
  }) as T;
}
