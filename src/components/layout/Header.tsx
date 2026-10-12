import React, { useState, useEffect } from 'react';
import { Bell, Moon } from 'lucide-react';
import { User } from '../../types';
import { store } from '../../services/store';

interface HeaderProps {
  title: string;
  currentUser: User | null;
  onOpenNotifications: () => void;
  isAdminView: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  currentUser,
  onOpenNotifications,
  isAdminView,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = (e?: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (key && key !== 'notifications' && key !== 'server_sync' && key !== 'broadcast') {
        return;
      }
      if (currentUser?.id) {
        const notifs = store.getNotifications(currentUser.id);
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadCount((prev) => (prev === unread ? prev : unread));
      }
    };
    updateCount();
    window.addEventListener('nexo_storage_change', updateCount);
    return () => window.removeEventListener('nexo_storage_change', updateCount);
  }, [currentUser?.id]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#050505]/95 backdrop-blur-md border-b border-[#282417]/60 px-4 md:px-8 flex items-center justify-between">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {isAdminView && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E6B92F]/20 text-[#E6B92F] border border-[#E6B92F]/40 font-semibold tracking-wide uppercase">
            NEXO Admin
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Icon Indicator */}
        <div className="w-9 h-9 rounded-lg bg-[#111116] border border-[#282417] flex items-center justify-center text-[#A5A5AE] cursor-default">
          <Moon className="w-4 h-4 text-[#A5A5AE]" />
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-lg bg-[#111116] hover:bg-[#181822] border border-[#282417] flex items-center justify-center text-[#A5A5AE] hover:text-[#E6B92F] transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E6B92F] text-black text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(230,185,47,0.8)]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Mini Profile pill on desktop */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#282417]">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#E6B92F] text-black font-bold flex items-center justify-center text-xs shrink-0 border border-[#E6B92F]/40">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}</span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-[#E6B92F] font-medium leading-none">
                {currentUser.tier} VIP
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
