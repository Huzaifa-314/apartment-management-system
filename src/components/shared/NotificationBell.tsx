import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    {notification.link ? (
                      <Link
                        to={notification.link}
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                        className="block"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(parseISO(notification.date), 'MMM d, h:mm a')}
                        </p>
                      </Link>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(parseISO(notification.date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No notifications</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;