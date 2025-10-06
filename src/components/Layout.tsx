import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { DocumentPreviewPanel } from './DocumentPreviewPanel';
import { FolderBrowserPanel } from './FolderBrowserPanel';
import { useDocumentStore } from '../store/useDocumentStore';
import { useDocumentNotifications } from '../hooks/useDocumentNotifications';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useDocumentNotifications();

  const previewDocument = useDocumentStore((state) => state.previewDocument);
  const selectedCategoryId = useDocumentStore((state) => state.selectedCategoryId);
  const isPreviewPanelCollapsed = useDocumentStore((state) => state.isPreviewPanelCollapsed);
  const setPreviewDocument = useDocumentStore((state) => state.setPreviewDocument);

  const showPreviewPanel = previewDocument || selectedCategoryId;

  const getMainMargin = () => {
    if (!showPreviewPanel) return '';

    if (isPreviewPanelCollapsed) {
      return 'mr-12';
    }
    return 'mr-0 lg:mr-[60%] xl:mr-[66.666%]';
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main
          className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${getMainMargin()}`}
        >
          {children}
        </main>
        <AnimatePresence mode="wait">
          {previewDocument ? (
            <DocumentPreviewPanel
              key={previewDocument.id}
              document={previewDocument}
              onClose={() => setPreviewDocument(null)}
            />
          ) : selectedCategoryId ? (
            <FolderBrowserPanel key={selectedCategoryId} />
          ) : null}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};
