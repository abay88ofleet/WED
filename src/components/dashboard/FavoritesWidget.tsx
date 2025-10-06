import React from 'react';
import { Star, FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { Document } from '../../types';

interface FavoritesWidgetProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onViewAll?: () => void;
}

export const FavoritesWidget: React.FC<FavoritesWidgetProps> = ({
  documents,
  onDocumentClick,
  onViewAll,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  const getFileIcon = (fileType: string) => {
    return FileText;
  };

  const getFileColor = (fileType: string) => {
    const colorMap: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      docx: 'text-blue-500',
      xls: 'text-green-500',
      xlsx: 'text-green-500',
      ppt: 'text-orange-500',
      pptx: 'text-orange-500',
    };
    return colorMap[fileType.toLowerCase()] || 'text-gray-500';
  };

  return (
    <DashboardWidget
      title="Pinned Documents"
      icon={Star}
      iconColor="text-amber-500"
      action={onViewAll ? { label: 'View All', onClick: onViewAll } : undefined}
    >
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No pinned documents</p>
            <p className="text-xs text-gray-400 mt-1">
              Star your favorite documents for quick access
            </p>
          </div>
        ) : (
          documents.slice(0, 5).map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            const iconColor = getFileColor(doc.fileType);

            return (
              <button
                key={doc.id}
                onClick={() => onDocumentClick(doc)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group text-left border border-transparent hover:border-gray-200"
              >
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {doc.fileType.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatSize(doc.fileSize)}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{doc.viewCount}</span>
                    </div>
                  </div>
                </div>

                <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </DashboardWidget>
  );
};
