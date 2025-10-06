import React from 'react';

export const DocumentGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
