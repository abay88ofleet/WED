import React, { useState, useEffect } from 'react';
import { X, Link2, Mail, Calendar, Lock, Copy, Check, Trash2, Eye, Download } from 'lucide-react';
import { createShareLink, getDocumentShares, revokeShare } from '../services/sharingService';
import { Document } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, document }) => {
  const [accessType, setAccessType] = useState<'view' | 'download'>('view');
  const [expiresIn, setExpiresIn] = useState<string>('7');
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [existingShares, setExistingShares] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadExistingShares();
    }
  }, [isOpen, document.id]);

  const loadExistingShares = async () => {
    const { data, error } = await getDocumentShares(document.id);
    if (data && !error) {
      setExistingShares(data);
    }
  };

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setError('');

    const expiresAt = expiresIn !== 'never'
      ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000)
      : undefined;

    const result = await createShareLink({
      documentId: document.id,
      accessType,
      expiresAt,
      sharedWithEmail: sharedWithEmail || undefined,
      password: usePassword ? password : undefined,
    });

    setIsGenerating(false);

    if (result.success && result.shareUrl) {
      setGeneratedLink(result.shareUrl);
      await loadExistingShares();
    } else {
      setError(result.error || 'Failed to generate share link');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeShare = async (shareId: string) => {
    const result = await revokeShare(shareId);
    if (result.success) {
      await loadExistingShares();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Share Document</h2>
              <p className="text-sm text-gray-500">{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New Share Link</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAccessType('view')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      accessType === 'view'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">View Only</span>
                  </button>
                  <button
                    onClick={() => setAccessType('download')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      accessType === 'download'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">View & Download</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expires In
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Share With (Optional)
                </label>
                <input
                  type="email"
                  value={sharedWithEmail}
                  onChange={(e) => setSharedWithEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Lock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Protect with password</span>
                </label>

                {usePassword && (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </button>

            {generatedLink && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Link Generated Successfully!</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {existingShares.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Share Links</h3>
              <div className="space-y-2">
                {existingShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {share.access_type === 'view' ? (
                          <Eye className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Download className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {share.access_type === 'view' ? 'View Only' : 'View & Download'}
                        </span>
                        {share.password && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {share.shared_with_email && (
                          <span>Shared with: {share.shared_with_email}</span>
                        )}
                        <span>Created: {formatDate(share.created_at)}</span>
                        {share.expires_at && (
                          <span>Expires: {formatDate(share.expires_at)}</span>
                        )}
                        <span>Accessed: {share.access_count} times</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
