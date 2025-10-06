import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Calendar,
  User,
  Eye,
  Tag,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Folder,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UnifiedDocumentViewer } from './UnifiedDocumentViewer';
import { Document } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { useDocumentUrl } from '../hooks/useDocumentUrl';

interface DocumentPreviewPanelProps {
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const DocumentPreviewPanel: React.FC<DocumentPreviewPanelProps> = ({
  document,
  onClose,
}) => {
  const {
    categories,
    toggleFavorite,
    isPreviewPanelCollapsed,
    togglePreviewPanel,
    previewCategoryDocuments,
    setPreviewDocument,
  } = useDocumentStore();
  const [zoom, setZoom] = useState(100);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showDocumentList, setShowDocumentList] = useState(true);

  const { url: signedUrl, loading: urlLoading, error: urlError } = useDocumentUrl(document.fileUrl);

  const category = categories.find((c) => c.id === document.categoryId);
  const hasMultipleDocuments = previewCategoryDocuments.length > 1;

  useEffect(() => {
    setZoom(100);
  }, [document.id]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0, width: isPreviewPanelCollapsed ? 48 : '100%' }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 ${
        isPreviewPanelCollapsed ? '' : 'lg:w-3/5 xl:w-2/3'
      }`}
    >
      {isPreviewPanelCollapsed ? (
        <div className="h-full flex flex-col items-center py-4 border-l border-gray-200 bg-gray-50">
          <button
            onClick={togglePreviewPanel}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors mb-4"
            title="Expand preview panel"
          >
            <PanelRightOpen className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Close preview"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={togglePreviewPanel}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Collapse preview panel"
              >
                <PanelRightClose className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Close preview"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {document.title}
                </h2>
                <p className="text-sm text-gray-500 truncate">{document.fileName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleFavorite(document.id)}
                className={`p-2 rounded-lg transition-colors ${
                  document.isFavorite
                    ? 'bg-yellow-50 hover:bg-yellow-100'
                    : 'hover:bg-gray-200'
                }`}
                title={document.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={`w-5 h-5 ${
                    document.isFavorite
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </button>
              <button
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Share document"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Download document"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-700 font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RotateCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hasMultipleDocuments && (
                <button
                  onClick={() => setShowDocumentList(!showDocumentList)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  {showDocumentList ? (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      Hide List
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Show List
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                {showMetadata ? (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {hasMultipleDocuments && showDocumentList && (
              <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span>Category Documents</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {previewCategoryDocuments.length} documents
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {previewCategoryDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setPreviewDocument(doc)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        doc.id === document.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          doc.id === document.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            doc.id === document.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {urlLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading document...</p>
                  </div>
                </div>
              ) : urlError ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-red-600">
                    <p>Error loading document</p>
                    <p className="text-sm text-gray-500 mt-2">{urlError}</p>
                  </div>
                </div>
              ) : signedUrl ? (
                <UnifiedDocumentViewer
                  fileUrl={signedUrl}
                  fileName={document.fileName}
                  fileType={document.fileType}
                  zoom={zoom}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Preview Not Available</p>
                    <p className="text-sm">
                      This document doesn't have a preview URL configured
                    </p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                      <Download className="w-4 h-4" />
                      Download to View
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showMetadata && (
              <div className="w-80 overflow-y-auto border-l border-gray-200 bg-white p-6 transition-all duration-300">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Document Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-900">{document.description}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">File Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {document.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">File Size</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">
                          {category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Uploaded By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {document.uploadedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Upload Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Last Modified</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(document.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Statistics
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Views
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {document.viewCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Downloads
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {document.downloadCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};
