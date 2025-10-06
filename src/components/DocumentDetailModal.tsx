import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Trash2,
  Star,
  Eye,
  Calendar,
  User,
  FolderOpen,
  FileText,
  Tag,
  Clock,
  History,
  MessageSquare,
} from 'lucide-react';
import { Document } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { ShareModal } from './ShareModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import TimestampProofVerification from './TimestampProofVerification';
import { downloadDocument, incrementViewCount, incrementDownloadCount } from '../services/documentService.fixed';
import { createAuditLog, AUDIT_ACTIONS } from '../services/auditService';

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getFileIcon = (fileType: string) => {
  const iconClass = 'w-20 h-20';
  switch (fileType) {
    case 'pdf':
      return <FileText className={`${iconClass} text-red-500`} />;
    case 'docx':
      return <FileText className={`${iconClass} text-blue-500`} />;
    case 'xlsx':
      return <FileText className={`${iconClass} text-green-500`} />;
    case 'pptx':
      return <FileText className={`${iconClass} text-orange-500`} />;
    default:
      return <FileText className={`${iconClass} text-gray-500`} />;
  }
};

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
}) => {
  const { categories, toggleFavorite, refreshDocuments } = useDocumentStore();
  const category = categories.find((c) => c.id === document.categoryId);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadDocument(document.fileUrl || '', document.fileName);
      await incrementDownloadCount(document.id);
      await createAuditLog({
        action: AUDIT_ACTIONS.DOCUMENT_DOWNLOAD,
        resourceType: 'document',
        resourceId: document.id,
        metadata: { fileName: document.fileName },
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleViewDocument = async () => {
    await incrementViewCount(document.id);
    await createAuditLog({
      action: AUDIT_ACTIONS.DOCUMENT_VIEW,
      resourceType: 'document',
      resourceId: document.id,
      metadata: { fileName: document.fileName },
    });
  };

  React.useEffect(() => {
    handleViewDocument();
  }, [document.id]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0">{getFileIcon(document.fileType)}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {document.title}
                </h2>
                <p className="text-gray-600 mb-3">{document.description}</p>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  File Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">File Name</p>
                      <p className="font-medium text-gray-900">{document.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">File Type</p>
                      <p className="font-medium text-gray-900">
                        {document.fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">File Size</p>
                      <p className="font-medium text-gray-900">
                        {formatFileSize(document.fileSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <FolderOpen className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">
                        {category?.name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Metadata
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Uploaded By</p>
                      <p className="font-medium text-gray-900">
                        {document.uploadedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Upload Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Last Modified</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(document.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Statistics</p>
                      <p className="font-medium text-gray-900">
                        {document.viewCount} views • {document.downloadCount}{' '}
                        downloads
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Preview
              </h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Preview not available</p>
                  <p className="text-xs">Download to view file contents</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <TimestampProofVerification
                documentId={document.id}
                documentHash={document.fileUrl || ''}
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => toggleFavorite(document.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                document.isFavorite
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  document.isFavorite ? 'fill-yellow-400' : ''
                }`}
              />
              {document.isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVersionHistoryOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <History className="w-4 h-4" />
                Versions
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={document}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        document={document}
        onVersionRestored={() => refreshDocuments()}
      />
    </>
  );
};
