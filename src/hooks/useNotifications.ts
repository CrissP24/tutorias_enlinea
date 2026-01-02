import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotificationsByUser, 
  getUnreadNotificationsCount, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification 
} from '@/lib/storage';
import type { Notification } from '@/types';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(() => {
    if (user) {
      setNotifications(getNotificationsByUser(user.id));
      setUnreadCount(getUnreadNotificationsCount(user.id));
    }
  }, [user]);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (!user) return;

    refreshNotifications();
    
    const interval = setInterval(() => {
      refreshNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const markAsRead = useCallback((id: string) => {
    markNotificationAsRead(id);
    refreshNotifications();
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(() => {
    if (user) {
      markAllNotificationsAsRead(user.id);
      refreshNotifications();
    }
  }, [user, refreshNotifications]);

  const addNotification = useCallback((
    userId: string,
    mensaje: string,
    tipo: Notification['tipo'],
    tutoriaId?: string
  ) => {
    createNotification({ userId, mensaje, tipo, tutoriaId });
    refreshNotifications();
  }, [refreshNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications,
  };
};
