import React from 'react';
import { CheckCircle } from 'lucide-react';

export const SuccessAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
            <p className="text-sm text-gray-600">Your documents have been uploaded</p>
          </div>
        </div>
      </div>
    </div>
  );
};
