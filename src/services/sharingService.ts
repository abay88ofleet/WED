import { supabase } from '../lib/supabase';
import { hashSharePassword, sanitizeTextInput } from './securityValidationService';
import { logSecurityEvent, SECURITY_EVENTS } from './securityAuditService';

export interface DocumentShare {
  id: string;
  documentId: string;
  shareToken: string;
  sharedBy: string;
  sharedWithEmail?: string;
  accessType: 'view' | 'download';
  expiresAt?: Date;
  password?: string;
  accessCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
}

export async function createShareLink(params: {
  documentId: string;
  accessType: 'view' | 'download';
  expiresAt?: Date;
  sharedWithEmail?: string;
  password?: string;
}): Promise<{ success: boolean; share?: DocumentShare; shareUrl?: string; error?: string }> {
  try {
    const { documentId, accessType, expiresAt, sharedWithEmail, password } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    let sanitizedEmail = sharedWithEmail;
    if (sharedWithEmail) {
      sanitizedEmail = sanitizeTextInput(sharedWithEmail);
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await hashSharePassword(password);
      if (!passwordHash) {
        return { success: false, error: 'Failed to secure password' };
      }
    }

    const { data: tokenData } = await supabase.rpc('generate_share_token');
    const shareToken = tokenData || Math.random().toString(36).substring(2, 15);

    const { data: share, error: insertError } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        share_token: shareToken,
        shared_by: user.id,
        shared_with_email: sanitizedEmail,
        access_type: accessType,
        expires_at: expiresAt?.toISOString(),
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await logSecurityEvent({
      action: 'document.share',
      resourceType: 'document',
      resourceId: documentId,
      severity: 'info',
      metadata: {
        accessType,
        hasPassword: !!password,
        hasExpiration: !!expiresAt,
        sharedWithEmail: sanitizedEmail,
      },
    });

    const shareUrl = `${window.location.origin}/share/${shareToken}`;

    return {
      success: true,
      share: {
        id: share.id,
        documentId: share.document_id,
        shareToken: share.share_token,
        sharedBy: share.shared_by,
        sharedWithEmail: share.shared_with_email,
        accessType: share.access_type as 'view' | 'download',
        expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
        password: share.password,
        accessCount: share.access_count,
        lastAccessedAt: share.last_accessed_at ? new Date(share.last_accessed_at) : undefined,
        createdAt: new Date(share.created_at),
      },
      shareUrl,
    };
  } catch (error) {
    console.error('Error creating share link:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDocumentShares(documentId: string) {
  const { data, error } = await supabase
    .from('document_shares')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function revokeShare(shareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking share:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function incrementShareAccess(shareToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_shares')
      .update({
        access_count: supabase.raw('access_count + 1'),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('share_token', shareToken);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error incrementing share access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function validateShareAccess(shareToken: string, password?: string) {
  const { data: share, error } = await supabase
    .from('document_shares')
    .select('*, documents(*)')
    .eq('share_token', shareToken)
    .maybeSingle();

  if (error || !share) {
    return { valid: false, error: 'Share link not found' };
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return { valid: false, error: 'Share link has expired' };
  }

  if (share.password && share.password !== password) {
    return { valid: false, error: 'Invalid password' };
  }

  return { valid: true, share, document: share.documents };
}

export async function getSharedDocument(
  shareToken: string,
  password?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { data, error } = await supabase.rpc('get_shared_document', {
      p_share_token: shareToken,
      p_password: password || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Error getting shared document:', error);
      return {
        success: false,
        error: 'Failed to access shared document',
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting shared document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

export async function checkRateLimit(ipAddress: string) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
    });

    if (error) {
      console.error('Error checking rate limit:', error);
      return { is_blocked: false };
    }

    return data && data.length > 0 ? data[0] : { is_blocked: false };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { is_blocked: false };
  }
}
