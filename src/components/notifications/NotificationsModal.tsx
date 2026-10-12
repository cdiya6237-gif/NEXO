import React, { useState, useEffect } from 'react';
import { Bell, Check, X, CheckCheck, Info, DollarSign, Package } from 'lucide-react';
import { NotificationItem, User } from '../../types';
import { store } from '../../services/store';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifs = () => {
    if (currentUser) {
      setNotifications(store.getNotifications(currentUser.id));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifs();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    if (currentUser) {
      store.markAllNotificationsRead(currentUser.id);
      loadNotifs();
    }
  };

  const handleMarkOne = (id: string) => {
    store.markNotificationRead(id);
    loadNotifs();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'commission':
      case 'deposit':
        return <DollarSign className="w-4 h-4 text-[#21D39B]" />;
      case 'order':
        return <Package className="w-4 h-4 text-[#E6B92F]" />;
      default:
        return <Info className="w-4 h-4 text-[#F4D66D]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#111116] border border-[#3A321C] rounded-2xl shadow-2xl overflow-hidden mt-14 mr-2">
        {/* Header */}
        <div className="p-4 border-b border-[#282417] flex items-center justify-between bg-[#15151c]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#E6B92F]" />
            <h3 className="font-bold text-sm text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-[#A5A5AE] hover:text-[#E6B92F] px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#A5A5AE] hover:text-white hover:bg-[#1f1f28] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-[#282417]/50 p-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#A5A5AE]">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => {
              const dateStr = new Date(notif.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkOne(notif.id)}
                  className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                    notif.read ? 'opacity-70 hover:bg-[#16161e]' : 'bg-[#181822] hover:bg-[#1d1d2b]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#101014] border border-[#282417] mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#E6B92F] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#A5A5AE] mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-[#A5A5AE]/70 mt-1.5 block">
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
