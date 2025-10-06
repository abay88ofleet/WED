import React, { useState, useEffect } from 'react';
import { X, Clock, Download, RotateCcw, Upload, FileText } from 'lucide-react';
import { getDocumentVersions, getVersionUrl, restoreVersion, createDocumentVersion } from '../services/versionService';
import { Document } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onVersionRestored?: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  document,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changesDescription, setChangesDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, document.id]);

  const loadVersions = async () => {
    setIsLoading(true);
    const { data, error } = await getDocumentVersions(document.id);
    if (data && !error) {
      setVersions(data);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return;
    }

    const result = await restoreVersion(versionId, document.id);
    if (result.success) {
      await loadVersions();
      onVersionRestored?.();
      alert('Version restored successfully!');
    } else {
      alert(result.error || 'Failed to restore version');
    }
  };

  const handleUploadNewVersion = async () => {
    if (!newVersionFile) return;

    setIsUploading(true);
    setError('');

    const result = await createDocumentVersion({
      documentId: document.id,
      file: newVersionFile,
      changesDescription,
    });

    setIsUploading(false);

    if (result.success) {
      setNewVersionFile(null);
      setChangesDescription('');
      await loadVersions();
      onVersionRestored?.();
    } else {
      setError(result.error || 'Failed to upload new version');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Version History</h2>
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upload New Version</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                type="file"
                onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                className="hidden"
                id="version-upload"
              />
              <label
                htmlFor="version-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                {newVersionFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{newVersionFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(newVersionFile.size)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Click to select a file</p>
                )}
              </label>
            </div>

            {newVersionFile && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={changesDescription}
                  onChange={(e) => setChangesDescription(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleUploadNewVersion}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload New Version'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Previous Versions ({versions.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No version history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">v{version.version_number}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Version {version.version_number}
                            {index === 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(version.created_at)} • {formatFileSize(version.file_size)}
                          </p>
                        </div>
                      </div>

                      {version.changes_description && (
                        <p className="text-sm text-gray-600 mt-2">{version.changes_description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <a
                          href={getVersionUrl(version.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                        {index !== 0 && (
                          <button
                            onClick={() => handleRestoreVersion(version.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
