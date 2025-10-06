import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, Clock, X } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchSection: React.FC = () => {
  const { filters, setSearchQuery, documents, addSearchHistory, searchHistory, clearSearchHistory } = useDocumentStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filters.search) {
      const allTerms = Array.from(
        new Set([
          ...documents.map(d => d.title),
          ...documents.flatMap(d => d.tags),
          ...documents.map(d => d.fileName),
        ])
      );

      const filtered = allTerms
        .filter(term =>
          term.toLowerCase().includes(filters.search.toLowerCase()) &&
          term.toLowerCase() !== filters.search.toLowerCase()
        )
        .slice(0, 5);

      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [filters.search, documents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = (term: string) => {
    if (term.trim()) {
      setSearchQuery(term);
      addSearchHistory(term);
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const selectSuggestion = (suggestion: string) => {
    handleSearchSubmit(suggestion);
  };

  const selectHistory = (term: string) => {
    handleSearchSubmit(term);
  };

  return (
    <div className="p-4 border-b border-gray-200 relative">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(filters.search);
              }
            }}
            placeholder="Search documents..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            aria-label="Search documents"
          />
          {filters.search && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Advanced search"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Advanced
          </button>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Search history"
          >
            <Clock className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (suggestions.length > 0 || searchHistory.length > 0) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSearchHistory();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
                {searchHistory.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => selectHistory(term)}
                    className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
          K
        </kbd>
        <span>to focus</span>
      </div>
    </div>
  );
};
