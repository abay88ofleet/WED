import { supabase } from '../lib/supabase';

export interface DocumentNotification {
  id: string;
  userId: string;
  documentId: string;
  documentTitle: string;
  action: 'upload' | 'update' | 'delete' | 'share';
  timestamp: string;
  read: boolean;
}

export const subscribeToDocumentNotifications = (
  currentUserId: string,
  onNotification: (notification: DocumentNotification) => void
) => {
  const channel = supabase
    .channel('document-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'documents',
      },
      (payload) => {
        const newDoc = payload.new as any;

        if (newDoc.uploaded_by !== currentUserId) {
          onNotification({
            id: newDoc.id,
            userId: newDoc.uploaded_by,
            documentId: newDoc.id,
            documentTitle: newDoc.title || newDoc.file_name,
            action: 'upload',
            timestamp: newDoc.uploaded_at || new Date().toISOString(),
            read: false,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
      },
      (payload) => {
        const updatedDoc = payload.new as any;

        if (updatedDoc.uploaded_by !== currentUserId) {
          onNotification({
            id: updatedDoc.id,
            userId: updatedDoc.uploaded_by,
            documentId: updatedDoc.id,
            documentTitle: updatedDoc.title || updatedDoc.file_name,
            action: 'update',
            timestamp: updatedDoc.updated_at || new Date().toISOString(),
            read: false,
          });
        }
      }
    )
    .subscribe();

  return channel;
};

export const unsubscribeFromNotifications = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
