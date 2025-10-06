import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Star,
  Eye,
  MoreVertical,
  Share2,
  Trash2,
} from 'lucide-react';
import { Document } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { FolderCard } from './FolderCard';

interface DocumentGridProps {
  documents: Document[];
  use3DView?: boolean;
}

const getFileIcon = (fileType: string) => {
  const iconClass = 'w-12 h-12';
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

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, use3DView = false }) => {
  const { setPreviewDocument, setViewMode, toggleFavorite, previewDocument } = useDocumentStore();

  const isDocumentSelected = (docId: string) => previewDocument?.id === docId;

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FileText className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Try adjusting your filters or search query</p>
      </div>
    );
  }

  if (use3DView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
        {documents.map((doc) => (
          <FolderCard
            key={doc.id}
            document={doc}
            onSelect={() => {
              setViewMode('list');
              setPreviewDocument(doc);
            }}
            onToggleFavorite={() => toggleFavorite(doc.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc, index) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`bg-white rounded-lg border transition-all duration-200 group relative ${
            isDocumentSelected(doc.id)
              ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={() => {
                  setViewMode('list');
                  setPreviewDocument(doc);
                }}
              >
                {getFileIcon(doc.fileType)}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(doc.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      doc.isFavorite
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => {
                setViewMode('list');
                setPreviewDocument(doc);
              }}
            >
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                {doc.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                {doc.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {doc.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{doc.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>{doc.fileType.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 border-t pt-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{doc.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>{doc.downloadCount}</span>
                </div>
                <span className="ml-auto">{formatDate(doc.uploadedAt)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 rounded-b-lg flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
