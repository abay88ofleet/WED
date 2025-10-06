import React from 'react';
import { useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();

  if (location.pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-end z-30">
      <div className="w-full sm:w-[75%] md:w-[65%] lg:w-[60%] xl:w-[55%]">
        <div className="bg-blue-600 rounded-l-xl sm:rounded-l-2xl shadow-lg py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-7 lg:py-6 lg:px-8">
          <h2 className="text-white text-center text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold tracking-wide uppercase leading-tight">
            SCAN & STORE HARDCOPY ARCHIVE DOCUMENTS
          </h2>
        </div>
      </div>
    </div>
  );
};
