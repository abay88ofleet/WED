import React, { useState, useEffect } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  fileUrl: string;
  fileName: string;
  zoom: number;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileUrl, fileName, zoom }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const loadSpreadsheet = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        if (!mounted) return;

        setWorkbook(wb);
        setActiveSheet(wb.SheetNames[0]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Excel document:', error);
        if (!mounted) return;

        setHasError(true);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load Excel document'
        );
        setIsLoading(false);
      }
    };

    loadSpreadsheet();

    return () => {
      mounted = false;
    };
  }, [fileUrl]);

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load Spreadsheet</p>
          <p className="text-sm mb-4">{errorMessage}</p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Spreadsheet
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (!workbook) {
    return null;
  }

  const sheet = workbook.Sheets[activeSheet];
  const htmlTable = XLSX.utils.sheet_to_html(sheet, { id: 'excel-table' });

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {workbook.SheetNames.length > 1 && (
        <div className="border-b border-gray-200 bg-white px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {workbook.SheetNames.map((sheetName) => (
              <button
                key={sheetName}
                onClick={() => setActiveSheet(sheetName)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeSheet === sheetName
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sheetName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-8">
        <div
          className="bg-white shadow-xl rounded-lg overflow-auto"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.3s ease',
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: htmlTable }}
            className="excel-table-container"
          />
        </div>
      </div>

      <style>{`
        .excel-table-container table {
          border-collapse: collapse;
          width: 100%;
          font-size: 14px;
        }
        .excel-table-container th,
        .excel-table-container td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        .excel-table-container th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .excel-table-container tr:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};
