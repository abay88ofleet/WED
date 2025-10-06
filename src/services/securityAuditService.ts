import { supabase } from '../lib/supabase';
import { sessionManager } from './securityConfigService';

export type SecurityEventSeverity = 'info' | 'warning' | 'critical';

export interface SecurityEvent {
  action: string;
  resourceType: string;
  resourceId: string;
  severity: SecurityEventSeverity;
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  severity: string;
  securityEvent: boolean;
  sessionId: string | null;
  createdAt: Date;
}

export interface SecurityMetrics {
  timeWindow: string;
  totalSecurityEvents: number;
  criticalEvents: number;
  quarantinedDocuments: number;
  failedAccessAttempts: number;
  suspiciousUsers: number;
  generatedAt: Date;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { action, resourceType, resourceId, severity, metadata = {} } = event;
    const sessionId = sessionManager.getSessionId();

    const { error } = await supabase.rpc('log_security_event', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_severity: severity,
      p_metadata: {
        ...metadata,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });

    if (error) {
      console.error('Failed to log security event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging security event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function detectSuspiciousActivity(
  userId: string,
  action: string,
  timeWindow = '1 hour'
): Promise<{
  isSuspicious: boolean;
  actionCount: number;
  threshold: number;
  reason?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('detect_suspicious_activity', {
      p_user_id: userId,
      p_action: action,
      p_time_window: timeWindow,
    });

    if (error) {
      console.error('Error detecting suspicious activity:', error);
      return {
        isSuspicious: false,
        actionCount: 0,
        threshold: 0,
      };
    }

    return {
      isSuspicious: data.is_suspicious,
      actionCount: data.action_count,
      threshold: data.threshold,
      reason: data.reason,
    };
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return {
      isSuspicious: false,
      actionCount: 0,
      threshold: 0,
    };
  }
}

export async function getSecurityMetrics(
  timeWindow = '24 hours'
): Promise<SecurityMetrics | null> {
  try {
    const { data, error } = await supabase.rpc('get_security_metrics', {
      p_time_window: timeWindow,
    });

    if (error) {
      console.error('Error getting security metrics:', error);
      return null;
    }

    return {
      timeWindow: data.time_window,
      totalSecurityEvents: data.total_security_events,
      criticalEvents: data.critical_events,
      quarantinedDocuments: data.quarantined_documents,
      failedAccessAttempts: data.failed_access_attempts,
      suspiciousUsers: data.suspicious_users,
      generatedAt: new Date(data.generated_at),
    };
  } catch (error) {
    console.error('Error getting security metrics:', error);
    return null;
  }
}

export async function getUserSecuritySummary(): Promise<{
  securityEventsCount: number;
  criticalEventsCount: number;
  lastSecurityEvent: Date | null;
  recentEvents: Array<{ action: string; severity: string; createdAt: Date }>;
} | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_security_summary')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        securityEventsCount: 0,
        criticalEventsCount: 0,
        lastSecurityEvent: null,
        recentEvents: [],
      };
    }

    return {
      securityEventsCount: data.security_events_count || 0,
      criticalEventsCount: data.critical_events_count || 0,
      lastSecurityEvent: data.last_security_event ? new Date(data.last_security_event) : null,
      recentEvents: data.recent_events || [],
    };
  } catch (error) {
    console.error('Error getting user security summary:', error);
    return null;
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      metadata: log.metadata || {},
      severity: log.severity,
      securityEvent: log.security_event,
      sessionId: log.session_id,
      createdAt: new Date(log.created_at),
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export async function getSecurityAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('security_event', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching security audit logs:', error);
      return [];
    }

    return (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      metadata: log.metadata || {},
      severity: log.severity,
      securityEvent: log.security_event,
      sessionId: log.session_id,
      createdAt: new Date(log.created_at),
    }));
  } catch (error) {
    console.error('Error fetching security audit logs:', error);
    return [];
  }
}

export const SECURITY_EVENTS = {
  VALIDATION_FAILED: 'document.validation_failed',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  FILE_QUARANTINED: 'security.file_quarantined',
  MALICIOUS_CONTENT_DETECTED: 'security.malicious_content_detected',
  FAILED_LOGIN: 'auth.failed_login',
  SESSION_HIJACK_ATTEMPT: 'security.session_hijack_attempt',
  XSS_ATTEMPT: 'security.xss_attempt',
  SQL_INJECTION_ATTEMPT: 'security.sql_injection_attempt',
} as const;
