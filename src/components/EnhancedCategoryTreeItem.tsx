import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Category, Document } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { useContextMenu } from '../hooks/useContextMenu';
import { FolderContextMenu } from './folders/FolderContextMenu';
import { FolderIcon } from './folders/FolderIcon';
import { FileTypeIcon } from './folders/FileTypeIcon';
import { PinnedFolderBadge } from './folders/PinnedFolderBadge';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { NewFolderModal } from './ui/NewFolderModal';
import { updateCategory, deleteCategory, pinCategory, createCategory } from '../services/categoryService.fixed';

interface EnhancedCategoryTreeItemProps {
  category: Category;
  childCategories?: Category[];
  documents?: Document[];
  getCategoryDocuments?: (categoryId: string) => Document[];
  getChildCategories?: (parentId: string) => Category[];
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
  onDocumentClick?: (document: Document) => void;
  onCategoryClick?: (categoryId: string) => void;
  onCategoryUpdate?: () => void;
  animated?: boolean;
  level?: number;
}

export function EnhancedCategoryTreeItem({
  category,
  childCategories = [],
  documents = [],
  getCategoryDocuments,
  getChildCategories,
  isSelected,
  onSelect,
  onDocumentClick,
  onCategoryClick,
  onCategoryUpdate,
  animated = true,
  level = 0,
}: EnhancedCategoryTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(category.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewDocument = useDocumentStore((state) => state.previewDocument);
  const contextMenu = useContextMenu<Category>();

  const hasChildren = childCategories.length > 0 || documents.length > 0;
  const isPinned = category.isPinned || false;

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

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setIsRenaming(true);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        setShowDeleteConfirm(true);
      } else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handleTogglePin();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isPinned]);

  const handleRename = async () => {
    if (newName.trim() && newName !== category.name) {
      await updateCategory(category.id, { name: newName.trim() });
      onCategoryUpdate?.();
    }
    setIsRenaming(false);
    setNewName(category.name);
  };

  const handleDelete = async () => {
    await deleteCategory(category.id);
    onCategoryUpdate?.();
  };

  const handleTogglePin = async () => {
    await pinCategory(category.id, !isPinned);
    onCategoryUpdate?.();
  };

  const handleNewFolder = (parentId: string) => {
    setShowNewFolderModal(true);
  };

  const handleUploadFiles = (categoryId: string) => {
    const { setUploadModalOpen, setPreSelectedCategoryId } = useDocumentStore.getState();
    setPreSelectedCategoryId(categoryId);
    setUploadModalOpen(true);
  };

  const handleCreateFolder = async (folderName: string) => {
    const { data, error } = await createCategory({
      name: folderName,
      parentId: category.id,
      color: category.color,
      icon: category.icon,
    });

    if (!error && data) {
      setIsOpen(true);
      onCategoryUpdate?.();
    }
  };

  const handleProperties = (categoryId: string) => {
    console.log('Show properties for:', categoryId);
  };

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
        <FileTypeIcon fileType={doc.fileType} size="sm" />
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
            <EnhancedCategoryTreeItem
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
              onCategoryUpdate={onCategoryUpdate}
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

  const handleContextMenu = (e: React.MouseEvent) => {
    contextMenu.openContextMenu(e, category);
  };

  return (
    <>
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
            onContextMenu={handleContextMenu}
            onDoubleClick={() => setIsRenaming(true)}
            className={`flex-1 flex items-center gap-2.5 py-2 ${
              level === 0 ? 'pr-3' : 'pr-3'
            } transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              isSelected ? 'text-gray-900 font-semibold' : 'text-gray-700 hover:text-gray-900'
            }`}
            aria-label={`${category.name}, ${category.documentCount} documents`}
            aria-current={isSelected ? 'page' : undefined}
            tabIndex={0}
          >
            <FolderIcon isOpen={isOpen && hasChildren} isPinned={isPinned} size="md" />
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setNewName(category.name);
                  }
                  e.stopPropagation();
                }}
                className="flex-1 px-2 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-left text-sm leading-tight">{category.name}</span>
            )}
            {isPinned && !isRenaming && <PinnedFolderBadge />}
            {category.documentCount > 0 && !isRenaming && (
              <span
                className={`text-xs tabular-nums px-2 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {category.documentCount}
              </span>
            )}
          </button>
        </CategoryContent>

        <ChildrenList />
      </div>

      <FolderContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        category={contextMenu.data}
        onClose={contextMenu.closeContextMenu}
        onNewFolder={handleNewFolder}
        onUploadFiles={handleUploadFiles}
        onRename={() => setIsRenaming(true)}
        onDelete={() => setShowDeleteConfirm(true)}
        onTogglePin={handleTogglePin}
        onProperties={handleProperties}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Folder"
        message={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <NewFolderModal
        isOpen={showNewFolderModal}
        parentName={category.name}
        onClose={() => setShowNewFolderModal(false)}
        onConfirm={handleCreateFolder}
      />
    </>
  );
}
