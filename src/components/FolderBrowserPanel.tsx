import React from 'react';
import {
  X,
  Folder,
  FileText,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDocumentStore } from '../store/useDocumentStore';

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

export const FolderBrowserPanel: React.FC = () => {
  const {
    categories,
    selectedCategoryId,
    previewCategoryDocuments,
    isPreviewPanelCollapsed,
    togglePreviewPanel,
    setPreviewDocument,
    setSelectedCategoryId,
    setPreviewDocuments,
  } = useDocumentStore();

  const handleClose = () => {
    setSelectedCategoryId(null);
  };

  const category = categories.find((c) => c.id === selectedCategoryId);

  if (!category) return null;

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
            onClick={handleClose}
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
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Close preview"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Folder className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {previewCategoryDocuments.length} {previewCategoryDocuments.length === 1 ? 'document' : 'documents'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            {previewCategoryDocuments.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Folder className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No Documents</p>
                  <p className="text-sm">
                    This folder doesn't contain any documents yet
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {previewCategoryDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setPreviewDocuments(previewCategoryDocuments);
                          setPreviewDocument(doc);
                        }}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <FileText className="w-10 h-10 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600">
                                  {doc.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {doc.description}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-gray-700">{doc.fileType.toUpperCase()}</span>
                              </span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                            {doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {doc.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
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
