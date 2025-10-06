import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Star,
  Clock,
  Share2,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Tag,
  Bookmark,
  Settings,
  FolderPlus,
  Keyboard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDocumentStore } from '../store/useDocumentStore';
import { CollapsibleSection } from './CollapsibleSection';
import { SearchSection } from './SearchSection';
import { ActiveFilters } from './ActiveFilters';
import { ResultStats } from './ResultStats';
import { SavedFilters } from './SavedFilters';
import { QuickTags } from './QuickTags';
import { EnhancedCategoryTreeItem } from './EnhancedCategoryTreeItem';
import { NewFolderModal } from './ui/NewFolderModal';
import { FolderSearchInput } from './FolderSearchInput';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { Document, Category } from '../types';
import { createCategory } from '../services/categoryService.fixed';

export const EnhancedSidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    filters,
    setCategoryFilter,
    isSidebarCollapsed,
    toggleSidebar,
    getTotalDocumentCount,
    getFavoritesCount,
    getSharedCount,
    getTrashCount,
    getCategoriesWithCounts,
    setPreviewDocuments,
    getAllDocumentsInCategory,
    browseFolderContents,
    refreshCategories,
  } = useDocumentStore();

  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const totalDocuments = getTotalDocumentCount();
  const favoritesCount = getFavoritesCount();
  const sharedCount = getSharedCount();
  const trashCount = getTrashCount();
  const categoriesWithCounts = getCategoriesWithCounts();

  const mainMenuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', count: null, route: '/' },
    { icon: FileText, label: 'All Documents', id: null, count: totalDocuments, route: '/documents' },
    { icon: Star, label: 'Favorites', id: 'favorites', count: favoritesCount, route: '/documents' },
    { icon: Clock, label: 'Recent', id: 'recent', count: null, route: '/documents' },
    { icon: Share2, label: 'Shared with me', id: 'shared', count: sharedCount > 0 ? sharedCount : null, route: '/documents' },
    { icon: Trash2, label: 'Trash', id: 'trash', count: trashCount > 0 ? trashCount : null, route: '/documents' },
  ];

  const documents = useDocumentStore((state) => state.documents);
  const setPreviewDocument = useDocumentStore((state) => state.setPreviewDocument);

  const handleCategoryClick = (categoryId: string) => {
    // Browse folder contents without auto-selecting any file
    browseFolderContents(categoryId);
  };

  const handleDocumentClick = (document: Document) => {
    // When a file is clicked, set it as the preview document
    // Keep the folder context intact
    setPreviewDocument(document);
  };

  const handleCategoryUpdate = async () => {
    // Refresh categories from database after any CRUD operation
    await refreshCategories();
  };

  const handleCreateTopLevelFolder = async (folderName: string) => {
    const { data, error } = await createCategory({
      name: folderName,
      parentId: null,
      color: '#3B82F6',
      icon: 'Folder',
    });

    if (!error && data) {
      await refreshCategories();
    }
  };

  const filterCategories = (categories: Category[], query: string): Category[] => {
    if (!query.trim()) return categories;

    const lowerQuery = query.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredCategories = folderSearchQuery
    ? filterCategories(categoriesWithCounts, folderSearchQuery)
    : categoriesWithCounts;

  const parentCategories = filteredCategories.filter((cat) => !cat.parentId);
  const getChildCategories = (parentId: string) =>
    filteredCategories.filter((cat) => cat.parentId === parentId);
  const getCategoryDocuments = (categoryId: string) =>
    documents.filter((doc) => doc.categoryId === categoryId);

  const handleFolderSearch = (query: string) => {
    setFolderSearchQuery(query);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (!navRef.current) return;

      const items = Array.from(navRef.current.querySelectorAll('[role="button"], button'));

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    };

    if (navRef.current) {
      navRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (navRef.current) {
        navRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && navRef.current) {
      const items = Array.from(navRef.current.querySelectorAll('[role="button"], button'));
      const item = items[focusedIndex] as HTMLElement;
      item?.focus();
    }
  }, [focusedIndex]);

  if (isSidebarCollapsed) {
    return (
      <aside
        className="w-16 bg-white border-r border-gray-200 flex flex-col fixed h-[calc(100vh-4rem)] z-30 transition-all duration-300"
        role="navigation"
        aria-label="Sidebar navigation"
      >
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" ref={navRef}>
          {mainMenuItems.map((item) => (
            <button
              key={item.id || 'all'}
              onClick={() => {
                if (item.id !== 'dashboard') {
                  setCategoryFilter(item.id);
                }
                navigate(item.route);
              }}
              className={`w-full p-3 flex items-center justify-center transition-colors relative group ${
                filters.categoryId === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => navigate('/settings')}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: 256 }}
      className="w-64 bg-[#F3F3F3] border-r border-gray-300 flex flex-col fixed h-[calc(100vh-4rem)] z-30 overflow-hidden"
      role="navigation"
      aria-label="Document library navigation"
    >
      <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Navigation</h2>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SearchSection />

        <CollapsibleSection
          title="Active Filters"
          defaultOpen={true}
          count={
            (filters.categoryId ? 1 : 0) +
            filters.fileTypes.length +
            filters.tags.length
          }
        >
          <ActiveFilters />
          <ResultStats />
        </CollapsibleSection>

        <div className="px-2 py-4 border-t border-gray-300">
          <h3 className="px-3 pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Quick Access
          </h3>
          <nav className="space-y-1" ref={navRef}>
            {mainMenuItems.map((item) => (
              <motion.button
                key={item.id || 'all'}
                onClick={() => {
                  if (item.id !== 'dashboard') {
                    setCategoryFilter(item.id);
                  }
                  navigate(item.route);
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full px-3 py-1.5 flex items-center gap-3 transition-colors ${
                  filters.categoryId === item.id
                    ? 'bg-[#E3F2FD] text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                role="button"
                aria-current={filters.categoryId === item.id ? 'page' : undefined}
                aria-label={`${item.label}${item.count !== null ? `, ${item.count} items` : ''}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.count !== null && (
                  <span className="text-xs text-gray-400">{item.count}</span>
                )}
              </motion.button>
            ))}
          </nav>
        </div>

        <CollapsibleSection title="Categories" icon={FileText} defaultOpen={true}>
          <FolderSearchInput
            onSearch={handleFolderSearch}
            placeholder="Search folders..."
          />
          {folderSearchQuery && (
            <div className="px-2 pb-2">
              <p className="text-xs text-gray-600">
                {parentCategories.length} {parentCategories.length === 1 ? 'folder' : 'folders'} found
              </p>
            </div>
          )}
          <div className="px-2 mb-2">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors group"
              aria-label="Create new top-level folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-gray-900">Create New Folder</span>
            </button>
          </div>
          <div className="space-y-0.5">
            {parentCategories.map((category) => {
              const childCategories = getChildCategories(category.id);
              const categoryDocuments = getCategoryDocuments(category.id);

              return (
                <EnhancedCategoryTreeItem
                  key={category.id}
                  category={category}
                  childCategories={childCategories}
                  documents={categoryDocuments}
                  getCategoryDocuments={getCategoryDocuments}
                  getChildCategories={getChildCategories}
                  isSelected={filters.categoryId === category.id}
                  onSelect={setCategoryFilter}
                  onDocumentClick={handleDocumentClick}
                  onCategoryClick={handleCategoryClick}
                  onCategoryUpdate={handleCategoryUpdate}
                  animated={true}
                />
              );
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Quick Tags" icon={Tag} defaultOpen={false}>
          <QuickTags />
        </CollapsibleSection>

        <CollapsibleSection title="Saved Filters" icon={Bookmark} defaultOpen={false}>
          <SavedFilters />
        </CollapsibleSection>
      </div>

      <div className="p-4 border-t border-gray-300 bg-white flex items-center justify-center gap-2">
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onConfirm={handleCreateTopLevelFolder}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </motion.aside>
  );
};
