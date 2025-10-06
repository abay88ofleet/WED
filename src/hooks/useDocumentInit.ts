import { useEffect } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';

export function useDocumentInit() {
  const { refreshDocuments, refreshCategories, initializeRealtime, cleanupRealtime } = useDocumentStore();

  useEffect(() => {
    const init = async () => {
      try {
        await refreshCategories();
        await refreshDocuments();
        initializeRealtime();
      } catch (error) {
        console.error('Error initializing documents:', error);
      }
    };

    init();

    return () => {
      cleanupRealtime();
    };
  }, [refreshDocuments, refreshCategories, initializeRealtime, cleanupRealtime]);
}
