import React, { useState } from 'react';
import { Grid2x2 as Grid, List, SlidersHorizontal, ArrowUpDown, Layers3, ChevronRight, Folder, Download } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { DocumentGrid } from '../components/DocumentGrid';
import { DocumentList } from '../components/DocumentList';
import { DocumentsSidebar } from '../components/DocumentsSidebar';
import { FilterPanel } from '../components/FilterPanel';
import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { UploadModal } from '../components/UploadModal';
import { useDocumentInit } from '../hooks/useDocumentInit';
import { DocumentGridSkeleton } from '../components/ui/DocumentGridSkeleton';
import { DocumentListSkeleton } from '../components/ui/DocumentListSkeleton';

export const DocumentsPage: React.FC = () => {
  useDocumentInit();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const {
    viewMode,
    use3DView,
    isLoading,
    setViewMode,
    toggle3DView,
    selectedDocument,
    setSelectedDocument,
    setPreviewDocument,
    isUploadModalOpen,
    setUploadModalOpen,
    preSelectedCategoryId,
    getFilteredDocuments,
    filters,
    setSortBy,
    setSortOrder,
    categories,
    setCategoryFilter,
    browseFolderContents,
    getCategoriesWithCounts,
  } = useDocumentStore();

  const documents = getFilteredDocuments();

  // Get current category and its subfolders
  const categoriesWithCounts = getCategoriesWithCounts();
  const currentCategory = filters.categoryId
    ? categoriesWithCounts.find(c => c.id === filters.categoryId)
    : null;

  const subfolders = currentCategory
    ? categoriesWithCounts.filter(c => c.parentId === currentCategory.id)
    : [];

  // Build breadcrumb trail
  const buildBreadcrumbs = () => {
    if (!currentCategory) return [];
    const trail = [currentCategory];
    let parent = categoriesWithCounts.find(c => c.id === currentCategory.parentId);
    while (parent) {
      trail.unshift(parent);
      parent = categoriesWithCounts.find(c => c.id === parent?.parentId);
    }
    return trail;
  };

  const breadcrumbs = buildBreadcrumbs();

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.fileTypes.length > 0 ||
    filters.tags.length > 0;

  return (
    <div className="flex h-full">
      <DocumentsSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {breadcrumbs.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                {breadcrumbs.map((category, index) => (
                  <React.Fragment key={category.id}>
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-gray-900">{category.name}</span>
                    ) : (
                      <button
                        onClick={() => browseFolderContents(category.id)}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {category.name}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {currentCategory && (
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'grid' && (
            <button
              onClick={toggle3DView}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                use3DView
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title="Toggle 3D folder view"
            >
              <Layers3 className="w-4 h-4" />
              <span className="text-sm font-medium">3D</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <ArrowUpDown className="w-4 h-4 text-gray-600" />
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  'name' | 'date' | 'size' | 'type',
                  'asc' | 'desc'
                ];
                setSortBy(sortBy);
                setSortOrder(sortOrder);
              }}
              className="text-sm text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
              <option value="type-asc">Type (A-Z)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <span className="font-medium">Filters active</span>
              <span className="text-blue-600">•</span>
              <span>{documents.length} results</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {(filters.fileTypes.length || 0) + (filters.tags.length || 0)}
            </span>
          )}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing <span className="font-medium text-gray-900">{documents.length}</span>{' '}
          documents
          {subfolders.length > 0 && (
            <span> and <span className="font-medium text-gray-900">{subfolders.length}</span> folders</span>
          )}
        </p>
        {filters.categoryId && !currentCategory && (
          <p>
            In category:{' '}
            <span className="font-medium text-gray-900">
              {filters.categoryId === 'favorites' && 'Favorites'}
              {filters.categoryId === 'recent' && 'Recent'}
              {filters.categoryId === 'shared' && 'Shared with me'}
              {filters.categoryId === 'trash' && 'Trash'}
            </span>
          </p>
        )}
      </div>

      {subfolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subfolders.map((subfolder) => {
              return (
                <button
                  key={subfolder.id}
                  onClick={() => browseFolderContents(subfolder.id)}
                  className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group text-left"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Folder className="w-8 h-8 text-yellow-500 group-hover:text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {subfolder.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {subfolder.documentCount} {subfolder.documentCount === 1 ? 'document' : 'documents'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div>
          {viewMode === 'grid' ? (
            <DocumentGridSkeleton count={8} />
          ) : (
            <DocumentListSkeleton count={10} />
          )}
        </div>
      ) : documents.length > 0 ? (
        <div>
          {subfolders.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Documents</h2>
          )}
          <div onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-preview-trigger]')) {
              const docId = target.closest('[data-preview-trigger]')?.getAttribute('data-doc-id');
              const doc = documents.find(d => d.id === docId);
              if (doc) {
                setPreviewDocument(doc);
              }
            }
          }}>
            {viewMode === 'grid' ? (
              <DocumentGrid documents={documents} use3DView={use3DView} />
            ) : (
              <DocumentList documents={documents} />
            )}
          </div>
        </div>
      ) : null}

      {subfolders.length === 0 && documents.length === 0 && filters.categoryId && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Folder className="w-20 h-20 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Empty Folder</p>
          <p className="text-sm">This folder doesn't contain any documents or subfolders yet</p>
        </div>
      )}

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        preSelectedCategoryId={preSelectedCategoryId}
      />
        </div>
      </div>
    </div>
  );
};
