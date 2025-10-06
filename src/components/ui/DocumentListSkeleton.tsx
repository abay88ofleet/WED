import React from 'react';

export const DocumentListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded" />
              <div className="w-8 h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
