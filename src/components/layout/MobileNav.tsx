import React from 'react';
import { Home, CheckSquare, FileText, Wallet, User as UserIcon } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'orders' as NavTab, label: 'Orders', icon: CheckSquare },
    { id: 'records' as NavTab, label: 'Records', icon: FileText },
    { id: 'deposit' as NavTab, label: 'Wallet', icon: Wallet },
    { id: 'profile' as NavTab, label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0d]/95 backdrop-blur-md border-t border-[#282417] px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-[#E6B92F]' : 'text-[#A5A5AE] hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#E6B92F]' : 'text-[#A5A5AE]'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
