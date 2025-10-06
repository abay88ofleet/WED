import React, { useState } from 'react';
import { AlertCircle, Download, Music } from 'lucide-react';

interface AudioViewerProps {
  fileUrl: string;
  fileName: string;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ fileUrl, fileName }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load Audio</p>
          <p className="text-sm mb-4">The audio format may not be supported by your browser.</p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Audio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center break-words">
            {fileName}
          </h3>
        </div>
        <audio
          src={fileUrl}
          controls
          onError={handleError}
          className="w-full"
          controlsList="nodownload"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};
