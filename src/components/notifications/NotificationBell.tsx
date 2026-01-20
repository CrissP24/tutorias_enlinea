import React, { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'solicitud':
        return '📚';
      case 'aceptada':
        return '✅';
      case 'rechazada':
        return '❌';
      case 'reprogramada':
        return '📅';
      case 'calificacion':
        return '⭐';
      case 'pdf':
        return '📄';
      case 'usuarios':
        return '👥';
      case 'mensaje':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                    !notification.leido && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className="text-lg flex-shrink-0">
                    {getNotificationIcon(notification.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      !notification.leido ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.mensaje}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.fecha), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  </div>
                  {!notification.leido && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
