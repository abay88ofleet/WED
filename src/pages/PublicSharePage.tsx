import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Download, Eye, FileText, AlertCircle, Shield, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PDFViewer } from '../components/PDFViewer';
import { UnifiedDocumentViewer } from '../components/UnifiedDocumentViewer';

interface ShareData {
  share: {
    id: string;
    access_type: 'view' | 'download';
    access_count: number;
  };
  document: {
    id: string;
    title: string;
    description: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    uploaded_at: string;
  };
}

export const PublicSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [showViewer, setShowViewer] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadSharedDocument();
    }
  }, [token]);

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const loadSharedDocument = async (providedPassword?: string) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;

      const { data, error: rpcError } = await supabase.rpc('get_shared_document', {
        p_share_token: token,
        p_password: providedPassword || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });

      if (rpcError) {
        setError('Failed to load shared document. Please try again.');
        setLoading(false);
        return;
      }

      if (!data.success) {
        if (data.error === 'rate_limited') {
          setRateLimited(true);
          setBlockedUntil(data.blocked_until);
          setError(data.message);
        } else if (data.error === 'invalid_password') {
          setRequiresPassword(true);
          setError('Invalid password. Please try again.');
        } else if (data.error === 'expired') {
          setError('This share link has expired.');
        } else if (data.error === 'not_found') {
          setError('Share link not found. It may have been revoked.');
        } else {
          setError(data.message || 'Unable to access shared document.');
        }

        if (data.requires_password) {
          setRequiresPassword(true);
        }

        setLoading(false);
        return;
      }

      setShareData(data as ShareData);

      // Get signed URL for the document
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(data.document.file_path, 3600);

      if (urlError || !urlData) {
        setError('Failed to load document file.');
        setLoading(false);
        return;
      }

      setDocumentUrl(urlData.signedUrl);
      setLoading(false);
    } catch (err) {
      console.error('Error loading shared document:', err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loadSharedDocument(password);
    }
  };

  const handleDownload = async () => {
    if (!shareData || !documentUrl) return;

    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = shareData.document.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (rateLimited) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Temporarily Blocked</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          {blockedUntil && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Blocked until: {formatDate(blockedUntil)}</span>
            </div>
          )}
          <p className="mt-6 text-sm text-gray-500">
            Too many failed access attempts. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (requiresPassword && !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Password Required
          </h1>
          <p className="text-gray-600 text-center mb-6">
            This document is password protected. Please enter the password to access it.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Access Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error && !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  const canDownload = shareData.share.access_type === 'download';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{shareData.document.title}</h1>
                <p className="text-sm text-gray-500">
                  {formatFileSize(shareData.document.file_size)} • {formatDate(shareData.document.uploaded_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canDownload && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              {!canDownload && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  <Eye className="w-4 h-4" />
                  View Only
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shareData.document.description && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
            <p className="text-gray-600">{shareData.document.description}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {shareData.document.file_type === 'application/pdf' ? (
            <PDFViewer fileUrl={documentUrl} />
          ) : (
            <UnifiedDocumentViewer
              fileUrl={documentUrl}
              fileName={shareData.document.file_name}
              fileType={shareData.document.file_type}
            />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>This document was shared securely. Accessed {shareData.share.access_count} times.</p>
        </div>
      </footer>
    </div>
  );
};
