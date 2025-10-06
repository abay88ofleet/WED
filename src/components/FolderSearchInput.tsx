import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface FolderSearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function FolderSearchInput({ onSearch, placeholder = 'Search folders...' }: FolderSearchInputProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative px-2 pb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="Search folders"
          role="searchbox"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Clear search"
            tabIndex={0}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      {query && (
        <p className="mt-1 text-xs text-gray-500" role="status" aria-live="polite">
          Press Esc to clear search
        </p>
      )}
    </div>
  );
}
