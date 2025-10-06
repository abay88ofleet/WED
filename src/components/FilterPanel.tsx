import React from 'react';
import { X, SlidersHorizontal, Calendar } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { allTags, fileTypeOptions } from '../data/dummyData';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose }) => {
  const { filters, setFileTypeFilter, setTagFilter, resetFilters } =
    useDocumentStore();

  const handleFileTypeToggle = (fileType: string) => {
    const newTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter((t) => t !== fileType)
      : [...filters.fileTypes, fileType];
    setFileTypeFilter(newTypes);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setTagFilter(newTags);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              File Type
            </h3>
            <div className="space-y-2">
              {fileTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={filters.fileTypes.includes(option.value)}
                    onChange={() => handleFileTypeToggle(option.value)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500">{option.count}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={resetFilters}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};
