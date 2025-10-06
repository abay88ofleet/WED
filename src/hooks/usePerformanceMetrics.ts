import { useEffect, useState } from 'react';
import { monitoringService } from '../services/monitoringService';

export interface PerformanceMetrics {
  pageLoadTime: number;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  memoryUsage: number;
  connectionSpeed: string;
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    ttfb: 0,
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
    memoryUsage: 0,
    connectionSpeed: 'unknown',
  });

  useEffect(() => {
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const newMetrics: Partial<PerformanceMetrics> = {};

      if (navigation) {
        newMetrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      const fcpEntry = paint.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        newMetrics.fcp = fcpEntry.startTime;
      }

      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
      }

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionSpeed = connection.effectiveType || 'unknown';
      }

      setMetrics((prev) => ({ ...prev, ...newMetrics }));
    };

    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      setMetrics((prev) => ({ ...prev, lcp: lastEntry.renderTime || lastEntry.loadTime }));
    });

    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics((prev) => ({ ...prev, fid: entry.processingStart - entry.startTime }));
      });
    });

    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      setMetrics((prev) => ({ ...prev, cls: clsValue }));
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('PerformanceObserver not supported', error);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      window.removeEventListener('load', collectMetrics);
    };
  }, []);

  return metrics;
}

export function useResourceTiming(resourceType?: string) {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const filtered = resourceType
      ? entries.filter((entry) => entry.initiatorType === resourceType)
      : entries;

    setResources(filtered);
  }, [resourceType]);

  return {
    resources,
    totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
    count: resources.length,
  };
}

export function useRenderMetrics(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    setRenderCount((prev) => prev + 1);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLastRenderTime(duration);

      monitoringService.recordMetric(
        `render_${componentName}`,
        duration,
        'ms',
        { renderCount: renderCount + 1 }
      );
    };
  });

  return {
    renderCount,
    lastRenderTime,
  };
}

export function useOperationTimer(operationName: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const start = () => {
    setIsRunning(true);
    setStartTime(performance.now());
  };

  const stop = () => {
    if (isRunning) {
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      setDuration(elapsed);
      setIsRunning(false);

      monitoringService.recordMetric(operationName, elapsed, 'ms');
    }
  };

  const reset = () => {
    setIsRunning(false);
    setDuration(0);
    setStartTime(0);
  };

  return {
    isRunning,
    duration,
    start,
    stop,
    reset,
  };
}

export function useMetricsSummary() {
  const [summary, setSummary] = useState(monitoringService.getMetricsSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(monitoringService.getMetricsSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return summary;
}
