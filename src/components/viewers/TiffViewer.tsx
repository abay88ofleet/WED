import React, { useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';

interface TiffViewerProps {
  fileUrl: string;
  fileName: string;
  zoom: number;
}

export const TiffViewer: React.FC<TiffViewerProps> = ({ fileUrl, fileName, zoom }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load TIFF Image</p>
          <p className="text-sm mb-4">
            TIFF files may not be natively supported by your browser. Consider converting to PNG or JPEG.
          </p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Image
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading image...</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <img
          src={fileUrl}
          alt={fileName}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          className="shadow-xl"
        />
      </div>
    </div>
  );
};
