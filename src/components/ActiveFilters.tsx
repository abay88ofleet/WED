import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDocumentStore } from '../store/useDocumentStore';

export const ActiveFilters: React.FC = () => {
  const { filters, setFileTypeFilter, setTagFilter, setCategoryFilter, resetFilters, categories } =
    useDocumentStore();

  const activeFilters: Array<{ type: string; value: string; label: string }> = [];

  if (filters.categoryId) {
    const category = categories.find((c) => c.id === filters.categoryId);
    if (category) {
      activeFilters.push({
        type: 'category',
        value: filters.categoryId,
        label: category.name,
      });
    }
  }

  filters.fileTypes.forEach((type) => {
    activeFilters.push({
      type: 'fileType',
      value: type,
      label: type.toUpperCase(),
    });
  });

  filters.tags.forEach((tag) => {
    activeFilters.push({
      type: 'tag',
      value: tag,
      label: tag,
    });
  });

  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'category':
        setCategoryFilter(null);
        break;
      case 'fileType':
        setFileTypeFilter(filters.fileTypes.filter((t) => t !== value));
        break;
      case 'tag':
        setTagFilter(filters.tags.filter((t) => t !== value));
        break;
    }
  };

  if (activeFilters.length === 0) {
    return (
      <div className="px-2 py-3">
        <p className="text-xs text-gray-500 text-center">No active filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <motion.div
            key={`${filter.type}-${filter.value}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group"
          >
            <span className="flex items-center gap-1">
              {filter.type === 'fileType' && '📄'}
              {filter.type === 'tag' && '🏷️'}
              {filter.type === 'category' && '📁'}
              {filter.label}
            </span>
            <button
              onClick={() => removeFilter(filter.type, filter.value)}
              className="flex-shrink-0 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <button
          onClick={resetFilters}
          className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};
