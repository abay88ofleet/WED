import React from 'react';
import { AlertCircle, Download, FileQuestion } from 'lucide-react';

interface UnsupportedViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
}) => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500 max-w-md px-4">
        <FileQuestion className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">Preview Not Available</p>
        <p className="text-sm mb-2">
          Preview is not currently supported for {fileType.toUpperCase()} files.
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Supported formats: PDF, Images (JPEG, PNG, TIFF), Word, Excel, PowerPoint, Video, Audio
        </p>
        <a
          href={fileUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download File
        </a>
      </div>
    </div>
  );
};
