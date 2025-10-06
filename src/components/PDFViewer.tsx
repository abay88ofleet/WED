import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  zoom: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName, zoom }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [showThumbnails, setShowThumbnails] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        if (!mounted) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        if (!mounted) return;

        setHasError(true);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load PDF document'
        );
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      mounted = false;
    };
  }, [fileUrl]);

  const renderPage = useCallback(async (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number
  ) => {
    if (!pdfDoc) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error(`Error rendering page ${pageNumber}:`, error);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (!pdfDoc || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth - 64;

    const renderVisiblePages = async () => {
      const pages = Array.from(pageRefs.current.entries());

      for (const [pageNumber, pageDiv] of pages) {
        if (renderedPages.has(pageNumber)) continue;

        const canvas = pageDiv.querySelector('canvas');
        if (!canvas) continue;

        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth * (zoom / 100)) / viewport.width;

        await renderPage(pageNumber, canvas, scale);
        setRenderedPages(prev => new Set(prev).add(pageNumber));
      }
    };

    renderVisiblePages();
  }, [pdfDoc, zoom, renderPage, renderedPages]);

  useEffect(() => {
    if (!pdfDoc) return;

    const renderThumbnails = async () => {
      for (let i = 1; i <= numPages; i++) {
        const canvas = thumbnailCanvasRefs.current.get(i);
        if (!canvas) continue;

        await renderPage(i, canvas, 0.25);
      }
    };

    if (showThumbnails) {
      renderThumbnails();
    }
  }, [pdfDoc, numPages, showThumbnails, renderPage]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(entry.target.getAttribute('data-page-number') || '1');
            setCurrentPage(pageNumber);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5,
      }
    );

    pageRefs.current.forEach((pageDiv) => {
      if (observerRef.current) {
        observerRef.current.observe(pageDiv);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [numPages, pdfDoc]);

  const scrollToPage = useCallback((pageNumber: number) => {
    const pageDiv = pageRefs.current.get(pageNumber);
    if (pageDiv && scrollContainerRef.current) {
      pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handleThumbnailClick = (pageNumber: number) => {
    scrollToPage(pageNumber);
  };

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Unable to Load Document</p>
          <p className="text-sm mb-4">
            {errorMessage || 'The document preview could not be loaded.'}
          </p>
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
        <>
          <div className="flex-1 flex overflow-hidden">
            {showThumbnails && (
              <div className="w-48 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
                <div className="p-3 space-y-3">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
                    <div
                      key={pageNumber}
                      onClick={() => handleThumbnailClick(pageNumber)}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:border-blue-500 hover:shadow-md ${
                        currentPage === pageNumber
                          ? 'border-blue-600 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-300'
                      }`}
                    >
                      <canvas
                        ref={(el) => {
                          if (el) thumbnailCanvasRefs.current.set(pageNumber, el);
                        }}
                        className="w-full h-auto bg-white"
                      />
                      <div className={`text-center py-1 text-xs font-medium ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {pageNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto bg-gray-100 scroll-smooth"
            >
              <div className="py-8 px-8 space-y-4">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
                  <div
                    key={pageNumber}
                    ref={(el) => {
                      if (el) pageRefs.current.set(pageNumber, el);
                    }}
                    data-page-number={pageNumber}
                    className="flex justify-center"
                  >
                    <canvas className="shadow-xl border border-gray-300 bg-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showThumbnails ? 'Hide' : 'Show'} Thumbnails
              </button>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
