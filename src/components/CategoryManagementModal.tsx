import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard as Edit2, Trash2, Folder, Loader2, AlertCircle } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { createCategory, updateCategory, deleteCategory } from '../services/categoryService.fixed';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose }) => {
  const { categories, refreshCategories } = useDocumentStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: 'Folder',
    color: '#3B82F6',
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableIcons = [
    'Folder',
    'FileText',
    'Image',
    'Video',
    'Music',
    'Code',
    'DollarSign',
    'Users',
    'Megaphone',
    'Scale',
    'Briefcase',
    'Archive',
  ];

  const availableColors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ];

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      icon: 'Folder',
      color: '#3B82F6',
      parentId: null,
    });
    setError('');
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        parentId: category.parentId,
      });
      setEditingId(categoryId);
      setIsCreating(false);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await updateCategory(editingId, formData);
        if (error) {
          console.error('Update category error:', error);
          setError(error.message || 'Failed to update category');
          setLoading(false);
          return;
        }
      } else {
        const { error } = await createCategory(formData);
        if (error) {
          console.error('Create category error:', error);
          setError(error.message || 'Failed to create category');
          setLoading(false);
          return;
        }
      }

      await refreshCategories();
      resetForm();
    } catch (err) {
      console.error('Exception in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Documents in this category will not be deleted.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await deleteCategory(categoryId);
      if (error) {
        setError(error.message || 'Failed to delete category');
        setLoading(false);
        return;
      }

      await refreshCategories();
      if (editingId === categoryId) {
        resetForm();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create and organize document categories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  New Category
                </button>
              </div>

              {error && !isCreating && !editingId && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                {rootCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No categories yet</p>
                    <p className="text-sm">Create your first category to get started</p>
                  </div>
                ) : (
                  rootCategories.map(category => (
                    <div
                      key={category.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        editingId === category.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <Folder className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {category.documentCount} documents
                        </p>
                      </div>
                      <button
                        onClick={() => handleEdit(category.id)}
                        disabled={loading}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              {(isCreating || editingId) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit Category' : 'Create New Category'}
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Category name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {availableIcons.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon })}
                            disabled={loading}
                            className={`p-3 border rounded-lg transition-colors ${
                              formData.icon === icon
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Folder className="w-5 h-5 mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            disabled={loading}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              formData.color === color
                                ? 'border-gray-900 scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Category (Optional)
                      </label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">None (Root Category)</option>
                        {rootCategories
                          .filter(c => c.id !== editingId)
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editingId ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
