import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Calendar, FileType, Tag, Star, TrendingUp } from 'lucide-react';
import { advancedSearch, getSuggestions, getRecentSearches, saveSearchToHistory } from '../services/searchService';
import { Document } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (document: Document) => void;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
}) => {
  const navigate = useNavigate();
  const { setPreviewDocument } = useDocumentStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState({
    categoryIds: [] as string[],
    tags: [] as string[],
    fileTypes: [] as string[],
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    isFavorite: undefined as boolean | undefined,
  });

  useEffect(() => {
    if (isOpen) {
      loadRecentSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        loadSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  };

  const loadSuggestions = async () => {
    const suggestions = await getSuggestions(query);
    setSuggestions(suggestions);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    saveSearchToHistory(query);

    const result = await advancedSearch({
      query,
      ...filters,
    });

    setResults(result.results);
    setTotalCount(result.totalCount);
    setIsSearching(false);
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    setTimeout(() => handleSearch(), 100);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Advanced Search</h2>
                <p className="text-sm text-gray-500">Find documents across your library</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by title, content, tags, or filename..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
            </button>

            {recentSearches.length > 0 && !query && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Recent:</span>
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date From
                  </label>
                  <input
                    type="date"
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date To
                  </label>
                  <input
                    type="date"
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isFavorite === true}
                    onChange={(e) => setFilters({ ...filters, isFavorite: e.target.checked ? true : undefined })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Favorites Only</span>
                </label>
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {totalCount > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold text-gray-900">{totalCount}</span> results
              </p>
            </div>
          )}

          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length === 0 && query ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <button
                  key={result.document.id}
                  onClick={() => {
                    if (onSelectDocument) {
                      onSelectDocument(result.document);
                    } else {
                      setPreviewDocument(result.document);
                      navigate('/documents');
                    }
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-gray-900 mb-1"
                        dangerouslySetInnerHTML={{ __html: result.highlightedTitle || result.document.title }}
                      />
                      {result.snippet && (
                        <p
                          className="text-sm text-gray-600 mb-2 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(result.document.uploadedAt)}</span>
                        <span>{formatFileSize(result.document.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <FileType className="w-3 h-3" />
                          {result.document.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    </div>
                    {result.document.isFavorite && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>

                  {result.document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.document.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
