import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export async function createAuditLog(params: {
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { action, resourceType, resourceId, metadata = {} } = params;

    const { error } = await supabase.rpc('create_audit_log', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_metadata: metadata,
    });

    if (error) {
      console.warn('Failed to create audit log:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.warn('Error creating audit log:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function getResourceAuditLogs(resourceType: string, resourceId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export const AUDIT_ACTIONS = {
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_DOWNLOAD: 'document.download',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_SHARE: 'document.share',
  DOCUMENT_VERSION: 'document.version',
  ANNOTATION_CREATE: 'annotation.create',
  ANNOTATION_UPDATE: 'annotation.update',
  ANNOTATION_DELETE: 'annotation.delete',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
} as const;
