import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Document, Category, ViewMode, FilterOptions, SortBy, SortOrder } from '../types';
import { getDocuments, getCategories, toggleFavorite as toggleFavoriteAPI, getDocumentUrl } from '../services/documentService.fixed';
import { realtimeManager } from '../services/realtimeService';

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterOptions;
  createdAt: Date;
}

interface DocumentStore {
  documents: Document[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  use3DView: boolean;
  selectedDocument: Document | null;
  previewDocument: Document | null;
  previewDocuments: Document[];
  selectedCategoryId: string | null;
  previewCategoryDocuments: Document[];
  filters: FilterOptions;
  isUploadModalOpen: boolean;
  preSelectedCategoryId: string | null;
  isSidebarCollapsed: boolean;
  isPreviewPanelCollapsed: boolean;
  savedFilters: SavedFilter[];
  searchHistory: string[];
  expandedSections: Record<string, boolean>;
  isRealtimeConnected: boolean;

  refreshDocuments: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  initializeRealtime: () => void;
  cleanupRealtime: () => void;

  setViewMode: (mode: ViewMode) => void;
  toggle3DView: () => void;
  setSelectedDocument: (document: Document | null) => void;
  setPreviewDocuments: (documents: Document[]) => void;
  setSelectedCategoryId: (categoryId: string | null) => void;
  setPreviewDocument: (document: Document | null) => void;
  setPreviewCategoryDocuments: (documents: Document[]) => void;
  getAllCategoryDocuments: (categoryId: string) => Document[];
  browseFolderContents: (categoryId: string) => void;
  toggleFavorite: (documentId: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (categoryId: string | null) => void;
  setFileTypeFilter: (fileTypes: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  resetFilters: () => void;
  setUploadModalOpen: (isOpen: boolean) => void;
  setPreSelectedCategoryId: (categoryId: string | null) => void;
  toggleSidebar: () => void;
  togglePreviewPanel: () => void;
  getFilteredDocuments: () => Document[];
  addSavedFilter: (name: string) => void;
  deleteSavedFilter: (id: string) => void;
  applySavedFilter: (id: string) => void;
  renameSavedFilter: (id: string, newName: string) => void;
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  toggleSection: (sectionId: string) => void;
  getTotalDocumentCount: () => number;
  getFavoritesCount: () => number;
  getSharedCount: () => number;
  getAllDocumentsInCategory: (categoryId: string) => Document[];
  getTrashCount: () => number;
  getCategoryCount: (categoryId: string) => number;
  getCategoriesWithCounts: () => Category[];
}

const defaultFilters: FilterOptions = {
  search: '',
  categoryId: null,
  fileTypes: [],
  tags: [],
  dateRange: {
    start: null,
    end: null,
  },
  sortBy: 'date',
  sortOrder: 'desc',
};

export const useDocumentStore = create<DocumentStore>()(persist(
  (set, get) => ({
    documents: [],
    categories: [],
    isLoading: false,
    error: null,
    viewMode: 'grid',
    previewDocuments: [],
    selectedCategoryId: null,
    use3DView: false,
    selectedDocument: null,
    previewDocument: null,
    previewCategoryDocuments: [],
    filters: defaultFilters,
    isUploadModalOpen: false,
    preSelectedCategoryId: null,
    isSidebarCollapsed: false,
    isPreviewPanelCollapsed: false,
    savedFilters: [],
    searchHistory: [],
    expandedSections: {
      activeFilters: true,
      quickAccess: true,
      categories: true,
      quickTags: false,
      savedFilters: false,
    },
    isRealtimeConnected: false,

  refreshDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getDocuments();
      if (error) {
        console.error('Error fetching documents:', error);
        set({ error: typeof error === 'string' ? error : error.message || 'Failed to fetch documents', isLoading: false, documents: [] });
      } else {
        const mappedDocuments: Document[] = (data || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description || '',
          fileName: doc.file_name,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          categoryId: doc.category_id || '',
          tags: doc.tags || [],
          uploadedBy: doc.uploaded_by,
          uploadedAt: new Date(doc.uploaded_at),
          updatedAt: new Date(doc.updated_at),
          fileUrl: doc.file_path,
          isFavorite: doc.is_favorite || false,
          downloadCount: doc.download_count || 0,
          viewCount: doc.view_count || 0,
        }));
        set({ documents: mappedDocuments, isLoading: false });
      }
    } catch (err) {
      console.error('Unexpected error in refreshDocuments:', err);
      set({ error: 'An unexpected error occurred', isLoading: false, documents: [] });
    }
  },

  refreshCategories: async () => {
    try {
      const { data, error } = await getCategories();
      if (error) {
        console.error('Error fetching categories:', error);
        set({ categories: [] });
      } else if (data) {
        const mappedCategories: Category[] = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'Folder',
          parentId: cat.parent_id,
          color: cat.color || '#6b7280',
          documentCount: 0,
          isPinned: cat.is_pinned || false,
          sortOrder: cat.sort_order || 0,
          updatedAt: cat.updated_at ? new Date(cat.updated_at) : undefined,
        }));
        set({ categories: mappedCategories });
      } else {
        set({ categories: [] });
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      set({ categories: [] });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  toggle3DView: () => set((state) => ({ use3DView: !state.use3DView })),

  setSelectedDocument: (document) => set({ selectedDocument: document }),

  setPreviewDocument: (document) => set({ previewDocument: document, selectedCategoryId: null }),

  setPreviewDocuments: (documents) => set({ previewDocuments: documents }),

  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),

  setPreviewCategoryDocuments: (documents) => set({ previewCategoryDocuments: documents }),

  getAllCategoryDocuments: (categoryId) => {
    const { documents, categories } = get();

    const collectDocuments = (catId: string): Document[] => {
      const directDocs = documents.filter(doc => doc.categoryId === catId);
      const childCategories = categories.filter(cat => cat.parentId === catId);
      const childDocs = childCategories.flatMap(child => collectDocuments(child.id));
      return [...directDocs, ...childDocs];
    };

    return collectDocuments(categoryId);
  },

  toggleFavorite: async (documentId) => {
    const doc = get().documents.find(d => d.id === documentId);
    if (!doc) return;

    const newFavoriteState = !doc.isFavorite;

    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === documentId ? { ...d, isFavorite: newFavoriteState } : d
      ),
    }));

    const { error } = await toggleFavoriteAPI(documentId, newFavoriteState);
    if (error) {
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId ? { ...d, isFavorite: !newFavoriteState } : d
        ),
      }));
      console.error('Failed to toggle favorite:', error);
    }
  },

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, search: query },
    })),

  setCategoryFilter: (categoryId) =>
    set((state) => ({
      filters: { ...state.filters, categoryId },
    })),

  setFileTypeFilter: (fileTypes) =>
    set((state) => ({
      filters: { ...state.filters, fileTypes },
    })),

  setTagFilter: (tags) =>
    set((state) => ({
      filters: { ...state.filters, tags },
    })),

  setSortBy: (sortBy) =>
    set((state) => ({
      filters: { ...state.filters, sortBy },
    })),

  setSortOrder: (sortOrder) =>
    set((state) => ({
      filters: { ...state.filters, sortOrder },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),

  setPreSelectedCategoryId: (categoryId) => set({ preSelectedCategoryId: categoryId }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  togglePreviewPanel: () =>
    set((state) => ({ isPreviewPanelCollapsed: !state.isPreviewPanelCollapsed })),

  getFilteredDocuments: () => {
    const { documents, filters } = get();
    let filtered = [...documents];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.fileName.toLowerCase().includes(searchLower) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Only show documents directly in the selected category (not descendants)
    if (filters.categoryId) {
      filtered = filtered.filter((doc) => doc.categoryId === filters.categoryId);
    }

    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter((doc) =>
        filters.fileTypes.includes(doc.fileType)
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((doc) =>
        filters.tags.some((tag) => doc.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  },

  addSavedFilter: (name) =>
    set((state) => ({
      savedFilters: [
        ...state.savedFilters,
        {
          id: `filter-${Date.now()}`,
          name,
          filters: { ...state.filters },
          createdAt: new Date(),
        },
      ],
    })),

  deleteSavedFilter: (id) =>
    set((state) => ({
      savedFilters: state.savedFilters.filter((f) => f.id !== id),
    })),

  applySavedFilter: (id) =>
    set((state) => {
      const filter = state.savedFilters.find((f) => f.id === id);
      return filter ? { filters: { ...filter.filters } } : {};
    }),

  renameSavedFilter: (id, newName) =>
    set((state) => ({
      savedFilters: state.savedFilters.map((f) =>
        f.id === id ? { ...f, name: newName } : f
      ),
    })),

  addSearchHistory: (term) =>
    set((state) => {
      const history = [term, ...state.searchHistory.filter((t) => t !== term)].slice(0, 10);
      return { searchHistory: history };
    }),

  clearSearchHistory: () => set({ searchHistory: [] }),

  toggleSection: (sectionId) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [sectionId]: !state.expandedSections[sectionId],
      },
    })),

  getTotalDocumentCount: () => {
    return get().documents.length;
  },

  getFavoritesCount: () => {
    return get().documents.filter(doc => doc.isFavorite).length;
  },

  getSharedCount: () => {
    // In a real app, this would filter by shared status
    // For now, return a sample count
    return 0;
  },

  getTrashCount: () => {
    // In a real app, this would filter by trash status
    // For now, return a sample count
    return 0;
  },

  getCategoryCount: (categoryId) => {
    const { documents, categories } = get();

    // Check if this category has children
    const childCategories = categories.filter(cat => cat.parentId === categoryId);

    if (childCategories.length > 0) {
      // If it has children, count documents in this category AND all children
      const childIds = childCategories.map(cat => cat.id);
      return documents.filter(doc =>
        doc.categoryId === categoryId || childIds.includes(doc.categoryId)
      ).length;
    }

    // Otherwise just count documents directly in this category
    return documents.filter(doc => doc.categoryId === categoryId).length;
  },

  getAllDocumentsInCategory: (categoryId: string) => {
    const { documents, categories } = get();

    const getAllChildCategoryIds = (parentId: string): string[] => {
      const directChildren = categories.filter(cat => cat.parentId === parentId);
      const allChildren = [parentId];

      directChildren.forEach(child => {
        allChildren.push(...getAllChildCategoryIds(child.id));
      });

      return allChildren;
    };

    const allCategoryIds = getAllChildCategoryIds(categoryId);
    return documents.filter(doc => allCategoryIds.includes(doc.categoryId));
  },

  browseFolderContents: (categoryId: string) => {
    const { getAllDocumentsInCategory } = get();
    const allDocs = getAllDocumentsInCategory(categoryId);

    set({
      selectedCategoryId: null, // Don't open the full-screen panel
      previewCategoryDocuments: allDocs,
      previewDocument: null, // Don't auto-select any document
      filters: { ...get().filters, categoryId }, // Set the category filter to show in main area
    });
  },

  getCategoriesWithCounts: () => {
    const { categories, getCategoryCount } = get();
    return categories.map(category => ({
      ...category,
      documentCount: getCategoryCount(category.id),
    }));
  },

  initializeRealtime: () => {
    realtimeManager.subscribeToDocuments((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const { documents } = get();

      if (eventType === 'INSERT' && newRecord) {
        const mappedDoc: Document = {
          id: newRecord.id,
          title: newRecord.title,
          description: newRecord.description || '',
          fileName: newRecord.file_name,
          fileType: newRecord.file_type,
          fileSize: newRecord.file_size,
          categoryId: newRecord.category_id || '',
          tags: newRecord.tags || [],
          uploadedBy: newRecord.uploaded_by,
          uploadedAt: new Date(newRecord.uploaded_at),
          updatedAt: new Date(newRecord.updated_at),
          fileUrl: newRecord.file_path,
          isFavorite: newRecord.is_favorite || false,
          downloadCount: newRecord.download_count || 0,
          viewCount: newRecord.view_count || 0,
        };

        set({ documents: [...documents, mappedDoc] });
      } else if (eventType === 'UPDATE' && newRecord) {
        const updatedDoc: Document = {
          id: newRecord.id,
          title: newRecord.title,
          description: newRecord.description || '',
          fileName: newRecord.file_name,
          fileType: newRecord.file_type,
          fileSize: newRecord.file_size,
          categoryId: newRecord.category_id || '',
          tags: newRecord.tags || [],
          uploadedBy: newRecord.uploaded_by,
          uploadedAt: new Date(newRecord.uploaded_at),
          updatedAt: new Date(newRecord.updated_at),
          fileUrl: newRecord.file_path,
          isFavorite: newRecord.is_favorite || false,
          downloadCount: newRecord.download_count || 0,
          viewCount: newRecord.view_count || 0,
        };

        set({
          documents: documents.map((doc) =>
            doc.id === newRecord.id ? updatedDoc : doc
          ),
        });
      } else if (eventType === 'DELETE' && oldRecord) {
        set({
          documents: documents.filter((doc) => doc.id !== oldRecord.id),
        });
      }
    });

    realtimeManager.subscribeToCategories((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const { categories } = get();

      if (eventType === 'INSERT' && newRecord) {
        const mappedCategory: Category = {
          id: newRecord.id,
          name: newRecord.name,
          icon: newRecord.icon || 'Folder',
          parentId: newRecord.parent_id,
          color: newRecord.color || '#6b7280',
          documentCount: 0,
          isPinned: newRecord.is_pinned || false,
          sortOrder: newRecord.sort_order || 0,
          updatedAt: newRecord.updated_at ? new Date(newRecord.updated_at) : undefined,
        };

        set({ categories: [...categories, mappedCategory] });
      } else if (eventType === 'UPDATE' && newRecord) {
        const updatedCategory: Category = {
          id: newRecord.id,
          name: newRecord.name,
          icon: newRecord.icon || 'Folder',
          parentId: newRecord.parent_id,
          color: newRecord.color || '#6b7280',
          documentCount: 0,
          isPinned: newRecord.is_pinned || false,
          sortOrder: newRecord.sort_order || 0,
          updatedAt: newRecord.updated_at ? new Date(newRecord.updated_at) : undefined,
        };

        set({
          categories: categories.map((cat) =>
            cat.id === newRecord.id ? updatedCategory : cat
          ),
        });
      } else if (eventType === 'DELETE' && oldRecord) {
        set({
          categories: categories.filter((cat) => cat.id !== oldRecord.id),
        });
      }
    });

    set({ isRealtimeConnected: realtimeManager.getConnectionStatus() });
  },

  cleanupRealtime: () => {
    realtimeManager.unsubscribeAll();
    set({ isRealtimeConnected: false });
  },
  }),
  {
    name: 'document-library-storage',
    partialize: (state) => ({
      isSidebarCollapsed: state.isSidebarCollapsed,
      isPreviewPanelCollapsed: state.isPreviewPanelCollapsed,
      savedFilters: state.savedFilters,
      searchHistory: state.searchHistory,
      expandedSections: state.expandedSections,
    }),
  }
));
