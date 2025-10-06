import React from 'react';
import {
  Home,
  FileText,
  Star,
  Clock,
  Share2,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { CategoryTreeItem } from './CategoryTreeItem';
import { Document } from '../types';

export const Sidebar: React.FC = () => {
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
    documents,
    setPreviewDocument,
    setPreviewDocuments,
    setSelectedCategoryId,
    getAllDocumentsInCategory,
    getAllCategoryDocuments,
    setPreviewCategoryDocuments,
  } = useDocumentStore();

  const totalDocuments = getTotalDocumentCount();
  const favoritesCount = getFavoritesCount();
  const sharedCount = getSharedCount();
  const trashCount = getTrashCount();
  const categoriesWithCounts = getCategoriesWithCounts();

  const mainMenuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', count: null },
    { icon: FileText, label: 'All Documents', id: null, count: totalDocuments },
    { icon: Star, label: 'Favorites', id: 'favorites', count: favoritesCount },
    { icon: Clock, label: 'Recent', id: 'recent', count: null },
    { icon: Share2, label: 'Shared with me', id: 'shared', count: sharedCount > 0 ? sharedCount : null },
    { icon: Trash2, label: 'Trash', id: 'trash', count: trashCount > 0 ? trashCount : null },
  ];

  const parentCategories = categoriesWithCounts.filter((cat) => !cat.parentId);

  const getChildCategories = (parentId: string) =>
    categoriesWithCounts.filter((cat) => cat.parentId === parentId);

  const getCategoryDocuments = (categoryId: string) =>
    documents.filter((doc) => doc.categoryId === categoryId);

  const handleCategoryClick = (categoryId: string) => {
    const allDocs = getAllDocumentsInCategory(categoryId);
    setSelectedCategoryId(categoryId);
    setPreviewDocuments(allDocs);
    if (allDocs.length > 0) {
      setPreviewDocument(allDocs[0]);
    }
  };

  const handleDocumentClick = (document: Document) => {
    const category = categoriesWithCounts.find(c => c.id === document.categoryId);
    if (category) {
      const allDocs = getAllDocumentsInCategory(category.id);
      setPreviewDocuments(allDocs);
    } else {
      setPreviewDocuments([document]);
    }
    setPreviewDocument(document);
  };

  if (isSidebarCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col fixed h-[calc(100vh-4rem)] z-30 transition-all duration-300">
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <PanelLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {mainMenuItems.map((item) => (
            <button
              key={item.id || 'all'}
              onClick={() => setCategoryFilter(item.id)}
              className={`w-full p-3 flex items-center justify-center transition-colors relative group ${
                filters.categoryId === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-[#F3F3F3] border-r border-gray-300 flex flex-col fixed h-[calc(100vh-4rem)] z-30 transition-all duration-300">
      <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Navigation</h2>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <PanelLeftClose className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-1">
          {mainMenuItems.map((item) => (
            <button
              key={item.id || 'all'}
              onClick={() => setCategoryFilter(item.id)}
              className={`w-full px-3 py-1.5 flex items-center gap-3 transition-colors ${
                filters.categoryId === item.id
                  ? 'bg-[#E3F2FD] text-gray-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.count !== null && (
                <span className="text-xs text-gray-400">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 px-2">
          <div className="px-3 py-2 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z" fill="#F9A825"/>
              <path d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z" stroke="#E65100" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Categories
            </h3>
          </div>

          <div className="space-y-0.5 mt-2">
            {parentCategories.map((category) => {
              const childCategories = getChildCategories(category.id);
              const categoryDocuments = getCategoryDocuments(category.id);

              return (
                <CategoryTreeItem
                  key={category.id}
                  onCategoryClick={handleCategoryClick}
                  category={category}
                  childCategories={childCategories}
                  documents={categoryDocuments}
                  isSelected={filters.categoryId === category.id}
                  onSelect={setCategoryFilter}
                  onDocumentClick={handleDocumentClick}
                  animated={true}
                />
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
};
