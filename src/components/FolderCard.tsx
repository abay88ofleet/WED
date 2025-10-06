import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Star, Eye, Download } from 'lucide-react';
import { Document } from '../types';

interface FolderCardProps {
  document: Document;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

const getFileColorByType = (fileType: string): { folder: string; tab: string; gradient: string } => {
  switch (fileType) {
    case 'pdf':
      return {
        folder: 'bg-red-600',
        tab: 'bg-red-400',
        gradient: 'from-red-500 to-red-400',
      };
    case 'docx':
      return {
        folder: 'bg-blue-600',
        tab: 'bg-blue-400',
        gradient: 'from-blue-500 to-blue-400',
      };
    case 'xlsx':
      return {
        folder: 'bg-green-600',
        tab: 'bg-green-400',
        gradient: 'from-green-500 to-green-400',
      };
    case 'pptx':
      return {
        folder: 'bg-orange-600',
        tab: 'bg-orange-400',
        gradient: 'from-orange-500 to-orange-400',
      };
    default:
      return {
        folder: 'bg-amber-600',
        tab: 'bg-amber-400',
        gradient: 'from-amber-500 to-amber-400',
      };
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const FolderCard: React.FC<FolderCardProps> = ({
  document,
  onSelect,
  onToggleFavorite,
}) => {
  const colors = getFileColorByType(document.fileType);

  return (
    <div className="relative group flex flex-col items-center justify-center w-full h-full">
      <div className="file relative w-60 h-40 cursor-pointer origin-bottom [perspective:1500px] z-10">
        <div
          onClick={onSelect}
          className={`work-5 ${colors.folder} w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:${colors.folder} after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:${colors.folder} before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]`}
        />
        <motion.div
          className="work-4 absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none flex items-center justify-center"
          initial={false}
          whileHover={{ transform: 'rotateX(-20deg)' }}
        >
          <FileText className="w-16 h-16 text-zinc-200" />
        </motion.div>
        <motion.div
          className="work-3 absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom"
          initial={false}
          whileHover={{ transform: 'rotateX(-30deg)' }}
        />
        <motion.div
          className="work-2 absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom"
          initial={false}
          whileHover={{ transform: 'rotateX(-38deg)' }}
        />
        <motion.div
          onClick={onSelect}
          className={`work-1 absolute bottom-0 bg-gradient-to-t ${colors.gradient} w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:${colors.tab} after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:${colors.tab} before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end p-4`}
          initial={false}
          whileHover={{
            transform: 'rotateX(-46deg) translateY(1px)',
            boxShadow: `inset 0 20px 40px rgba(251, 191, 36, 0.6), inset 0 -20px 40px rgba(217, 119, 6, 0.6)`,
          }}
        >
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80 font-medium uppercase tracking-wide">
                {document.fileType}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    document.isFavorite
                      ? 'fill-white text-white'
                      : 'text-white/60'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{document.viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{document.downloadCount}</span>
              </div>
              <span className="ml-auto">{formatFileSize(document.fileSize)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 w-60 text-center px-2">
        <h3
          onClick={onSelect}
          className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
        >
          {document.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
          {document.description}
        </p>
        <div className="flex flex-wrap gap-1 justify-center">
          {document.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {document.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{document.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
