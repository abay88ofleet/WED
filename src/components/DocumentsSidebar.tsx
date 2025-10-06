import React, { useState } from 'react';
import { Search, Folder, ChevronRight, ChevronDown, FolderPlus, Pin, MoreVertical } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { createCategory, pinCategory } from '../services/categoryService.fixed';

export const DocumentsSidebar: React.FC = () => {
  const {
    categories,
    filters,
    setCategoryFilter,
    browseFolderContents,
    getCategoriesWithCounts,
    refreshCategories,
  } = useDocumentStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);

  const categoriesWithCounts = getCategoriesWithCounts();

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const { error } = await createCategory({
      name: newFolderName.trim(),
      parentId: parentFolderId,
    });

    if (!error) {
      setNewFolderName('');
      setIsCreatingFolder(false);
      setParentFolderId(null);
      await refreshCategories();
    } else {
      console.error('Failed to create folder:', error);
    }
  };

  const handleTogglePin = async (folderId: string, currentPinState: boolean) => {
    const { error } = await pinCategory(folderId, !currentPinState);
    if (!error) {
      await refreshCategories();
    } else {
      console.error('Failed to toggle pin:', error);
    }
  };

  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const folders = categoriesWithCounts.filter(c => c.parentId === parentId);

    return folders.map((folder) => {
      const hasChildren = categoriesWithCounts.some(c => c.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = filters.categoryId === folder.id;

      return (
        <div key={folder.id} className="group relative">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (hasChildren) {
                  toggleFolder(folder.id);
                }
                browseFolderContents(folder.id);
              }}
              className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              {hasChildren && (
                <span onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </span>
              )}
              {!hasChildren && <span className="w-4" />}
              <Folder className={`w-4 h-4 flex-shrink-0 ${
                isSelected ? 'text-blue-600' : folder.isPinned ? 'text-yellow-500' : 'text-gray-500'
              }`} />
              <span className="flex-1 text-left truncate">{folder.name}</span>
              {folder.documentCount > 0 && (
                <span className="text-xs text-gray-500">{folder.documentCount}</span>
              )}
              {folder.isPinned && (
                <Pin className="w-3 h-3 text-yellow-500" />
              )}
            </button>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(folder.id, folder.isPinned || false);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title={folder.isPinned ? 'Unpin folder' : 'Pin folder'}
              >
                <Pin className={`w-4 h-4 ${folder.isPinned ? 'text-yellow-500' : 'text-gray-400'}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentFolderId(folder.id);
                  setIsCreatingFolder(true);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Create subfolder"
              >
                <FolderPlus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div>
              {renderFolderTree(folder.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => {
            setIsCreatingFolder(true);
            setParentFolderId(null);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      {isCreatingFolder && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {parentFolderId ? 'New Subfolder' : 'New Folder'}
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                  setParentFolderId(null);
                }
              }}
              placeholder="Folder name"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateFolder}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
                setParentFolderId(null);
              }}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            !filters.categoryId
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Folder className={`w-4 h-4 ${
            !filters.categoryId ? 'text-blue-600' : 'text-gray-500'
          }`} />
          <span className="flex-1 text-left">All Documents</span>
        </button>

        <div className="mt-2">
          {renderFolderTree()}
        </div>
      </div>
    </div>
  );
};
