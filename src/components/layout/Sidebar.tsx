import React from 'react';
import { Home, CheckSquare, FileText, Wallet, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { Logo } from '../common/Logo';
import { User } from '../../types';

export type NavTab = 'home' | 'orders' | 'records' | 'deposit' | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAdminAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'orders' as NavTab, label: 'Orders', icon: CheckSquare },
    { id: 'records' as NavTab, label: 'Order Records', icon: FileText },
    { id: 'deposit' as NavTab, label: 'Deposit', icon: Wallet },
    { id: 'profile' as NavTab, label: 'Profile', icon: UserIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#050505] border-r border-[#282417]/70 p-4 select-none justify-between z-20">
      {/* Top Logo and Nav */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-2 pt-2">
          <Logo size="md" />
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#E6B92F] text-black shadow-[0_2px_12px_rgba(230,185,47,0.25)] font-bold'
                    : 'text-[#A5A5AE] hover:text-white hover:bg-[#111116]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-[#A5A5AE]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Double-Click Secret Admin Icon */}
      <div className="pt-4 border-t border-[#282417]/70 space-y-3">
        {currentUser ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#101014] border border-[#282417]/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#E6B92F] text-black font-bold flex items-center justify-center text-sm shrink-0 border border-[#E6B92F]/40">
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
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-[#A5A5AE] font-medium uppercase tracking-wider truncate">
                  {currentUser.tier} Member
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#A5A5AE] hover:text-[#FF4D4D] hover:bg-[#1a1112] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-2 text-center text-xs text-[#A5A5AE]">
            Not signed in
          </div>
        )}
      </div>
    </aside>
  );
};
