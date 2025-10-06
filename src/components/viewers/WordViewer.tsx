import React, { useState, useEffect } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import mammoth from 'mammoth';

interface WordViewerProps {
  fileUrl: string;
  fileName: string;
  zoom: number;
}

export const WordViewer: React.FC<WordViewerProps> = ({ fileUrl, fileName, zoom }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();

        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (!mounted) return;

        setHtmlContent(result.value);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Word document:', error);
        if (!mounted) return;

        setHasError(true);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load Word document'
        );
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      mounted = false;
    };
  }, [fileUrl]);

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load Document</p>
          <p className="text-sm mb-4">{errorMessage}</p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Document
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
            <p className="text-sm text-gray-600">Loading document...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 overflow-auto p-8">
          <div
            className="max-w-4xl mx-auto bg-white shadow-xl p-12 rounded-lg"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.3s ease',
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="prose prose-sm max-w-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
