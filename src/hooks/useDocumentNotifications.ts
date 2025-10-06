import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { subscribeToDocumentNotifications, unsubscribeFromNotifications } from '../services/notificationService';

export function useDocumentNotifications() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToDocumentNotifications(user.id, (notification) => {
      const actionText = {
        upload: 'uploaded',
        update: 'updated',
        delete: 'deleted',
        share: 'shared',
      }[notification.action];

      showNotification({
        type: 'info',
        title: 'Document Activity',
        message: `"${notification.documentTitle}" was ${actionText}`,
        duration: 6000,
      });
    });

    return () => {
      unsubscribeFromNotifications(channel);
    };
  }, [user, showNotification]);
}
