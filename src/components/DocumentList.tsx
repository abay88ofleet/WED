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

interface DocumentListProps {
  documents: Document[];
}

const getFileIcon = (fileType: string) => {
  const iconClass = 'w-8 h-8';
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

export const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Stats
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((doc, index) => (
            <motion.tr
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className={`transition-colors group cursor-pointer ${
                isDocumentSelected(doc.id)
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setViewMode('list');
                setPreviewDocument(doc);
              }}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {doc.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase">
                  {doc.fileType}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatFileSize(doc.fileSize)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {doc.uploadedBy}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDate(doc.uploadedAt)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{doc.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>{doc.downloadCount}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
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
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Share2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
