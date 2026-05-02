import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '../types';
import { api } from '../lib/api';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'tenant') {
      setNotifications([]);
      return;
    }

    const load = async () => {
      try {
        const { data } = await api.get<{ notifications: Notification[] }>('/api/notifications');
        setNotifications(data.notifications);
      } catch {
        setNotifications([]);
      }
    };
    load();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
