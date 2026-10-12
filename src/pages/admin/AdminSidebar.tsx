import React from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  FileSpreadsheet,
  Package,
  Share2,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  ClipboardList,
  LogOut,
  ChevronRight,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { User } from '../../types';

export type AdminTab =
  | 'overview'
  | 'customers'
  | 'deposits'
  | 'withdrawals'
  | 'adjustments'
  | 'ledger'
  | 'products'
  | 'referrals'
  | 'banners'
  | 'chat'
  | 'audit-logs'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  currentAdmin: User;
  onExitAdmin: () => void;
  pendingDepositsCount?: number;
  pendingWithdrawalsCount?: number;
  unreadChatCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  currentAdmin,
  onExitAdmin,
  pendingDepositsCount = 0,
  pendingWithdrawalsCount = 0,
  unreadChatCount = 0,
}) => {
  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: ArrowDownLeft, badge: pendingDepositsCount },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawalsCount },
    { id: 'adjustments', label: 'Wallet Adjust', icon: Sliders },
    { id: 'ledger', label: 'Ledger', icon: FileSpreadsheet },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'referrals', label: 'Referrals', icon: Share2 },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'chat', label: 'Support Chat', icon: MessageSquare, badge: unreadChatCount },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: ShieldCheck },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-[#0c0c10] border-r border-[#282417] flex flex-col shrink-0 select-none">
      {/* Brand & Security Header */}
      <div className="p-5 border-b border-[#282417] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wider">ADMIN</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E6B92F]/20 text-[#E6B92F] font-bold border border-[#E6B92F]/40">
                PORTAL
              </span>
            </div>
            <p className="text-[10px] text-[#A5A5AE]">NEXO Control Center</p>
          </div>
        </div>
      </div>

      {/* Admin User Info Card */}
      <div className="p-4 mx-3 my-2.5 rounded-2xl bg-[#14141c] border border-[#282417] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6B92F] to-[#b38814] flex items-center justify-center text-black font-extrabold text-sm shadow-md">
          {currentAdmin.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">
              {currentAdmin.fullName || currentAdmin.username}
            </span>
            <Shield className="w-3 h-3 text-[#E6B92F] shrink-0" />
          </div>
          <p className="text-[10px] text-[#A5A5AE] font-mono truncate">
            @{currentAdmin.username} • Super Admin
          </p>
        </div>
      </div>

      {/* Vertical Navigation Items (Top to Bottom) */}
      <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#A5A5AE]/70 px-3 py-1.5">
          Main Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E6B92F] text-black font-bold shadow-md shadow-[#E6B92F]/20'
                  : 'text-[#A5A5AE] hover:text-white hover:bg-[#181822]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-black' : 'text-[#A5A5AE] group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                      isActive
                        ? 'bg-black text-[#E6B92F]'
                        : 'bg-[#E6B92F] text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-black" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Exit Button */}
      <div className="p-3 border-t border-[#282417] bg-[#0c0c10]/80">
        <button
          onClick={onExitAdmin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#14141c] hover:bg-red-950/30 text-[#A5A5AE] hover:text-red-400 border border-[#282417] hover:border-red-500/40 text-xs font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Panel</span>
        </button>
      </div>
    </aside>
  );
};
