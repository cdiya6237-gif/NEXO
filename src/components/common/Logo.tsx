import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  isAdmin?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, isAdmin = false }) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : size === 'xl' ? 'w-9 h-9' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-base';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-[#1c1708] to-[#111116] border border-[#E6B92F]/40 shadow-[0_0_15px_rgba(230,185,47,0.15)]">
        <ShoppingCart className={`${iconSize} text-[#E6B92F]`} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E6B92F] animate-ping opacity-75" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${textSize} font-black tracking-wider text-white`}>
            NEXO
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6B92F] text-black uppercase tracking-wider">
              Admin
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[8px] sm:text-[9px] tracking-[0.25em] font-bold text-[#A5A5AE] uppercase">
            SHOP. EARN. GROW.
          </span>
        )}
      </div>
    </div>
  );
};
