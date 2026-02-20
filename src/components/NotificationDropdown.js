import React, { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area.jsx';
import { useNotifications } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 relative"
          data-testid="notification-bell"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-3 py-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
