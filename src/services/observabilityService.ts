import { monitoringService } from './monitoringService';

export interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: Record<string, any>;
  status: 'success' | 'error' | 'pending';
  parentId?: string;
  children: Span[];
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

class ObservabilityService {
  private activeSpans: Map<string, Span> = new Map();
  private completedTraces: Map<string, Span[]> = new Map();
  private traceId: string = '';

  constructor() {
    this.traceId = this.generateTraceId();
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startSpan(name: string, attributes: Record<string, any> = {}, parentSpanId?: string): string {
    const spanId = this.generateSpanId();
    const span: Span = {
      id: spanId,
      name,
      startTime: performance.now(),
      attributes: {
        ...attributes,
        traceId: this.traceId,
      },
      status: 'pending',
      parentId: parentSpanId,
      children: [],
    };

    this.activeSpans.set(spanId, span);

    if (parentSpanId && this.activeSpans.has(parentSpanId)) {
      const parent = this.activeSpans.get(parentSpanId)!;
      parent.children.push(span);
    }

    return spanId;
  }

  endSpan(spanId: string, status: 'success' | 'error' = 'success', error?: any): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`Span ${spanId} not found`);
      return;
    }

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.attributes.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    monitoringService.recordMetric(
      `span_${span.name}`,
      span.duration,
      'ms',
      {
        status,
        traceId: this.traceId,
        spanId,
        attributes: span.attributes,
      }
    );

    if (!span.parentId) {
      const traceSpans = this.collectTraceSpans(span);
      this.completedTraces.set(this.traceId, traceSpans);
      this.traceId = this.generateTraceId();
    }

    this.activeSpans.delete(spanId);
  }

  private collectTraceSpans(rootSpan: Span): Span[] {
    const spans: Span[] = [rootSpan];

    const collectChildren = (span: Span) => {
      span.children.forEach((child) => {
        spans.push(child);
        collectChildren(child);
      });
    };

    collectChildren(rootSpan);
    return spans;
  }

  async traceAsync<T>(
    name: string,
    operation: (spanId: string) => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const spanId = this.startSpan(name, attributes);

    try {
      const result = await operation(spanId);
      this.endSpan(spanId, 'success');
      return result;
    } catch (error) {
      this.endSpan(spanId, 'error', error);
      throw error;
    }
  }

  traceSync<T>(
    name: string,
    operation: (spanId: string) => T,
    attributes: Record<string, any> = {}
  ): T {
    const spanId = this.startSpan(name, attributes);

    try {
      const result = operation(spanId);
      this.endSpan(spanId, 'success');
      return result;
    } catch (error) {
      this.endSpan(spanId, 'error', error);
      throw error;
    }
  }

  addSpanAttribute(spanId: string, key: string, value: any): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  addSpanEvent(spanId: string, name: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      if (!span.attributes.events) {
        span.attributes.events = [];
      }
      span.attributes.events.push({
        name,
        timestamp: performance.now(),
        attributes,
      });
    }
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  getCompletedTraces(): Map<string, Span[]> {
    return this.completedTraces;
  }

  getTraceTree(traceId: string): Span | null {
    const spans = this.completedTraces.get(traceId);
    if (!spans || spans.length === 0) return null;

    return spans[0];
  }

  clearTraces(): void {
    this.completedTraces.clear();
  }

  exportTrace(traceId: string): string {
    const spans = this.completedTraces.get(traceId);
    if (!spans) return '{}';

    return JSON.stringify({
      traceId,
      spans: spans.map((span) => ({
        id: span.id,
        name: span.name,
        duration: span.duration,
        startTime: span.startTime,
        endTime: span.endTime,
        status: span.status,
        attributes: span.attributes,
        parentId: span.parentId,
      })),
    }, null, 2);
  }

  visualizeTrace(traceId: string): string {
    const rootSpan = this.getTraceTree(traceId);
    if (!rootSpan) return 'Trace not found';

    const lines: string[] = [];

    const visualizeSpan = (span: Span, depth: number) => {
      const indent = '  '.repeat(depth);
      const duration = span.duration?.toFixed(2) || '?';
      const status = span.status === 'success' ? '✓' : span.status === 'error' ? '✗' : '⋯';
      lines.push(`${indent}${status} ${span.name} (${duration}ms)`);

      span.children.forEach((child) => visualizeSpan(child, depth + 1));
    };

    visualizeSpan(rootSpan, 0);
    return lines.join('\n');
  }
}

export const observabilityService = new ObservabilityService();

export function withTracing<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  getAttributes?: (...args: any[]) => Record<string, any>
): T {
  return (async (...args: any[]) => {
    const attributes = getAttributes ? getAttributes(...args) : {};
    return await observabilityService.traceAsync(
      operationName,
      () => fn(...args),
      attributes
    );
  }) as T;
}
