import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Category, Document } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';

interface CategoryTreeItemProps {
  category: Category;
  childCategories?: Category[];
  documents?: Document[];
  getCategoryDocuments?: (categoryId: string) => Document[];
  getChildCategories?: (parentId: string) => Category[];
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
  onDocumentClick?: (document: Document) => void;
  onCategoryClick?: (categoryId: string) => void;
  animated?: boolean;
  level?: number;
}

export function CategoryTreeItem({
  category,
  childCategories = [],
  documents = [],
  getCategoryDocuments,
  getChildCategories,
  isSelected,
  onSelect,
  onDocumentClick,
  onCategoryClick,
  animated = true,
  level = 0,
}: CategoryTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const previewDocument = useDocumentStore((state) => state.previewDocument);

  const hasChildren = childCategories.length > 0 || documents.length > 0;

  useEffect(() => {
    if (isSelected && hasChildren) {
      setIsOpen(true);
    }
  }, [isSelected, hasChildren]);

  useEffect(() => {
    if (previewDocument) {
      if (previewDocument.categoryId === category.id) {
        setIsOpen(true);
        setSelectedDocumentId(previewDocument.id);
      } else {
        const checkInChildCategories = (parentId: string): boolean => {
          const children = getChildCategories?.(parentId) || [];
          if (children.some((child) => child.id === previewDocument.categoryId)) {
            return true;
          }
          return children.some((child) => checkInChildCategories(child.id));
        };

        if (checkInChildCategories(category.id)) {
          setIsOpen(true);
        }
      }
    } else {
      setSelectedDocumentId(null);
    }
  }, [previewDocument, category.id, childCategories, getChildCategories]);

  const ChevronIcon = () =>
    animated ? (
      <motion.span
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
      </motion.span>
    ) : (
      <ChevronRight
        className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
        strokeWidth={2.5}
      />
    );

  const FolderIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg
      className={`${level === 0 ? 'w-4 h-4' : 'w-4 h-4'} flex-shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isExpanded ? (
        <>
          <path
            d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z"
            fill="#FDB022"
          />
          <path
            d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z"
            stroke="#D89614"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H11L9 4H5C3.89543 4 3 4.89543 3 6V7Z"
            fill="#FADB14"
          />
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H11L9 4H5C3.89543 4 3 4.89543 3 6V7Z"
            stroke="#D89614"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );

  const FileIcon = () => (
    <svg
      className="w-3.5 h-3.5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
        fill="#EBF5FF"
      />
      <path
        d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
        stroke="#3B82F6"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 2V9H20" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const DocumentItem = ({ doc }: { doc: Document }) => {
    const ItemContent = animated ? motion.button : 'button';
    const itemProps = animated
      ? {
          whileHover: { x: 2 },
          whileTap: { scale: 0.98 },
        }
      : {};

    const isDocumentSelected = selectedDocumentId === doc.id;

    const handleDocumentClick = () => {
      setSelectedDocumentId(doc.id);
      onDocumentClick?.(doc);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDocumentClick();
      }
    };

    return (
      <ItemContent
        {...itemProps}
        onClick={handleDocumentClick}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center gap-2.5 py-1.5 pr-3 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isDocumentSelected
            ? 'bg-blue-50 text-blue-900 font-semibold shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        aria-label={`${doc.title}`}
        aria-current={isDocumentSelected ? 'page' : undefined}
        tabIndex={0}
      >
        <FileIcon />
        <span className="flex-1 text-left text-sm truncate leading-tight">{doc.title}</span>
      </ItemContent>
    );
  };

  const ChildrenList = () => {
    if (!hasChildren) return null;

    const childrenContent = (
      <>
        {childCategories.map((child) => {
          const childDocs = getCategoryDocuments?.(child.id) || [];
          const grandchildCategories = getChildCategories?.(child.id) || [];

          return (
            <CategoryTreeItem
              key={child.id}
              category={child}
              childCategories={grandchildCategories}
              documents={childDocs}
              getCategoryDocuments={getCategoryDocuments}
              getChildCategories={getChildCategories}
              isSelected={isSelected && category.id === child.id}
              onSelect={onSelect}
              onDocumentClick={onDocumentClick}
              onCategoryClick={onCategoryClick}
              animated={animated}
              level={level + 1}
            />
          );
        })}
        {documents.map((doc) => (
          <div key={doc.id} className="relative flex items-center">
            <div className="flex items-center pl-4">
              <div className="w-5 h-px bg-gray-300" aria-hidden="true" />
            </div>
            <span className="w-8 flex-shrink-0" />
            <DocumentItem doc={doc} />
          </div>
        ))}
      </>
    );

    if (animated) {
      return (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-300" aria-hidden="true" />
                <div className="space-y-0.5">{childrenContent}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    return (
      isOpen && (
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-300" aria-hidden="true" />
          <div className="space-y-0.5">{childrenContent}</div>
        </div>
      )
    );
  };

  const CategoryContent = animated ? motion.div : 'div';
  const contentProps = animated
    ? {
        whileHover: { x: 2 },
        whileTap: { scale: 0.98 },
      }
    : {};

  const handleCategoryClick = () => {
    // Just expand/collapse the folder and show its contents in preview panel
    // Don't auto-select any file
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    onCategoryClick?.(category.id);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategoryClick();
    } else if (e.key === 'ArrowRight' && hasChildren && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'ArrowLeft' && hasChildren && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div>
      <CategoryContent
        {...contentProps}
        className={`group relative flex items-center rounded-md transition-all duration-150 ${
          isSelected ? 'bg-[#E3F2FD] shadow-sm' : 'hover:bg-gray-100'
        }`}
      >
        {level > 0 && (
          <div className="flex items-center pl-4">
            <div className="w-5 h-px bg-gray-300" aria-hidden="true" />
          </div>
        )}

        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`flex items-center justify-center w-6 h-6 ${level === 0 ? 'ml-1' : ''} my-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
            aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
            aria-expanded={isOpen}
            tabIndex={0}
          >
            <ChevronIcon />
          </button>
        ) : level === 0 ? (
          <span className="w-8 flex-shrink-0" />
        ) : null}

        <button
          ref={categoryButtonRef}
          onClick={handleCategoryClick}
          onKeyDown={handleCategoryKeyDown}
          className={`flex-1 flex items-center gap-2.5 py-2 ${
            level === 0 ? 'pr-3' : 'pr-3'
          } transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            isSelected ? 'text-gray-900 font-semibold' : 'text-gray-700 hover:text-gray-900'
          }`}
          aria-label={`${category.name}, ${category.documentCount} documents`}
          aria-current={isSelected ? 'page' : undefined}
          tabIndex={0}
        >
          <FolderIcon isExpanded={isOpen && hasChildren} />
          <span className="flex-1 text-left text-sm leading-tight">{category.name}</span>
          {category.documentCount > 0 && (
            <span className={`text-xs tabular-nums px-2 py-0.5 rounded-full font-medium ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {category.documentCount}
            </span>
          )}
        </button>
      </CategoryContent>

      <ChildrenList />
    </div>
  );
}
