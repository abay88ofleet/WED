import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, CreditCard as Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../store/useDocumentStore';

export const SavedFilters: React.FC = () => {
  const { savedFilters, addSavedFilter, deleteSavedFilter, applySavedFilter, renameSavedFilter, filters } =
    useDocumentStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    if (newFilterName.trim()) {
      addSavedFilter(newFilterName.trim());
      setNewFilterName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameSavedFilter(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.fileTypes.length > 0 ||
    filters.tags.length > 0 ||
    filters.search;

  return (
    <div className="space-y-2">
      {savedFilters.length === 0 && !isCreating && (
        <div className="px-2 py-4 text-center">
          <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-3">No saved filters yet</p>
          {hasActiveFilters && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Save current filter
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {savedFilters.map((filter) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="px-2"
          >
            {editingId === filter.id ? (
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(filter.id);
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleRename(filter.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  aria-label="Save name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <button
                  onClick={() => applySavedFilter(filter.id)}
                  className="flex-1 text-left text-sm text-gray-700 font-medium"
                >
                  {filter.name}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(filter.id, filter.name)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Rename filter"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSavedFilter(filter.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete filter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-2"
        >
          <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFilterName('');
                }
              }}
              placeholder="Filter name..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              aria-label="Save filter"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewFilterName('');
              }}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {!isCreating && hasActiveFilters && savedFilters.length > 0 && (
        <div className="px-2">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 border-dashed"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Current Filter
          </button>
        </div>
      )}
    </div>
  );
};
