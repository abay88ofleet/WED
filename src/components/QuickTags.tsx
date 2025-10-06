import React from 'react';
import { motion } from 'framer-motion';
import { useDocumentStore } from '../store/useDocumentStore';
import { allTags } from '../data/dummyData';

export const QuickTags: React.FC = () => {
  const { filters, setTagFilter } = useDocumentStore();

  const popularTags = allTags.slice(0, 12);

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setTagFilter(newTags);
  };

  return (
    <div className="px-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag, index) => {
          const isActive = filters.tags.includes(tag);
          return (
            <motion.button
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all transform hover:scale-105 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={isActive}
              aria-label={`Filter by ${tag} tag`}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>

      {filters.tags.length > 0 && (
        <button
          onClick={() => setTagFilter([])}
          className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Clear Tag Filters
        </button>
      )}
    </div>
  );
};
