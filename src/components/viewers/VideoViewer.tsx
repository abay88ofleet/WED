import React, { useRef, useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';

interface VideoViewerProps {
  fileUrl: string;
  fileName: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ fileUrl, fileName }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load Video</p>
          <p className="text-sm mb-4">The video format may not be supported by your browser.</p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Video
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <video
          ref={videoRef}
          src={fileUrl}
          controls
          onError={handleError}
          className="max-w-full max-h-full shadow-xl rounded-lg"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};
