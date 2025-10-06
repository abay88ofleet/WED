import React from 'react';
import { useDocumentStore } from '../store/useDocumentStore';

export const ResultStats: React.FC = () => {
  const { documents, getFilteredDocuments } = useDocumentStore();
  const filteredCount = getFilteredDocuments().length;
  const totalCount = documents.length;

  return (
    <div className="px-2 pt-2">
      <div className="flex items-center justify-around p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{filteredCount}</div>
          <div className="text-xs text-gray-600 font-medium">Results</div>
        </div>
        <div className="h-10 w-px bg-gray-300"></div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">{totalCount}</div>
          <div className="text-xs text-gray-600 font-medium">Total</div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`${filteredCount} of ${totalCount} documents found`}
      </div>
    </div>
  );
};
