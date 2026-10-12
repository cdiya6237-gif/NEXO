import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckSquare,
  Lock,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { User, PromotionalBanner, UserCycleState, CycleOrder } from '../types';
import { store } from '../services/store';

interface HomeDashboardProps {
  currentUser: User;
  onNavigateToOrders: () => void;
  onNavigateToRecords: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  onNavigateToOrders,
  onNavigateToRecords,
}) => {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [wallet, setWallet] = useState(store.getWalletMetrics(currentUser.id));
  const [cycle, setCycle] = useState<UserCycleState>(store.getUserCycleState(currentUser.id));
  const [recentActivities, setRecentActivities] = useState(
    store.getTransactions(currentUser.id).filter(t => t.type === 'order_commission' || t.type === 'commission' || t.type === 'referral_bonus').slice(0, 5)
  );

  const refreshData = () => {
    setWallet(store.getWalletMetrics(currentUser.id));
    setCycle(store.getUserCycleState(currentUser.id));
    setBanners(store.getBanners().filter(b => b.status === 'active'));
    setRecentActivities(
      store.getTransactions(currentUser.id).filter(t => t.type === 'order_commission' || t.type === 'commission' || t.type === 'referral_bonus').slice(0, 5)
    );
  };

  useEffect(() => {
    refreshData();
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (
        key &&
        !['user_balances', 'orders', 'banners', 'transactions', 'current_user', 'users', 'server_sync', 'broadcast'].includes(key)
      ) {
        return;
      }
      refreshData();
    };
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, [currentUser?.id, currentUser?.tier]);

  // Carousel Auto-rotation (5.5s)
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handlePrevBanner = () => {
    setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextBanner = () => {
    setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentBannerIdx] || {
    id: 'b-default',
    title: 'Global Order Processing',
    description: 'International E-Commerce Network',
    imageUrl: '',
    buttonText: 'Start Orders',
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* 1. Hero Promotional Banner Carousel (Section 15, 60, 61) */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-[#3A321C]/60 bg-[#111116] aspect-[21/9] sm:aspect-[2.4/1] max-h-[340px] group shadow-xl">
        {currentBanner.imageUrl ? (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#111116] to-[#1c1708]" />
        )}

        {/* Ambient Dark Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#E6B92F] px-2.5 py-0.5 rounded-full bg-black/60 border border-[#E6B92F]/40 backdrop-blur-xs inline-block">
              GLOBAL COMMERCE PIPELINE
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {currentBanner.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
              {currentBanner.description}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrevBanner}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#E6B92F] text-white hover:text-black border border-white/20 hover:border-transparent flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#E6B92F] text-white hover:text-black border border-white/20 hover:border-transparent flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentBannerIdx ? 'w-6 bg-[#E6B92F]' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Order Center Banner (Section 16 & screenshot) */}
      <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">Order Center</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A5A5AE]">Current Tier:</span>
            <span className="text-[22px] font-bold text-white tracking-wide">
              {currentUser.vipLevel || 'VIP 1'}
            </span>
          </div>
        </div>

        <button
          onClick={onNavigateToOrders}
          className="px-5 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_2px_12px_rgba(230,185,47,0.2)] cursor-pointer"
        >
          <span>{cycle.isCompleted ? 'View Completed Orders' : 'Process Daily Orders'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Dashboard Summary — Four Cards (Section 17 & screenshots) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Commission Earned */}
        <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#A5A5AE] uppercase tracking-wider">
              COMMISSION EARNED
            </span>
            <div className="p-2 rounded-xl bg-[#181822] text-[#E6B92F] border border-[#282417]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              ${wallet.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#21D39B] font-medium flex items-center gap-1 mt-1">
              Active ledger verified
            </span>
          </div>
        </div>

        {/* Card 2 — Pending Commission */}
        <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#A5A5AE] uppercase tracking-wider">
              PENDING COMMISSION
            </span>
            <div className="p-2 rounded-xl bg-[#181822] text-[#21D39B] border border-[#282417]">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              ${wallet.pendingCommission.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#A5A5AE] font-medium mt-1 block">
              In verification
            </span>
          </div>
        </div>

        {/* Card 3 — Held Balances */}
        <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#A5A5AE] uppercase tracking-wider">
              HELD BALANCES
            </span>
            <div className="p-2 rounded-xl bg-[#181822] text-zinc-300 border border-[#282417]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              ${wallet.held.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#A5A5AE] font-medium mt-1 block">
              Clearance hold: $0.00
            </span>
          </div>
        </div>

        {/* Card 4 — Order Progress */}
        <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-[#A5A5AE] uppercase tracking-wider">
              ORDER PROGRESS
            </span>
            <div className="p-2 rounded-xl bg-[#181822] text-[#F4D66D] border border-[#282417]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg md:text-xl font-extrabold text-[#E6B92F] tracking-tight">
              {cycle.isCompleted
                ? 'Order Complete 25 of 25'
                : `Order Complete ${cycle.orders.filter((o: CycleOrder) => o.status === 'completed').length} of 25`}
            </div>
            <span className="text-[10px] text-[#A5A5AE] font-bold mt-1 block uppercase tracking-wider">
              {currentUser.tier} VIP
            </span>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity (Section 18 & screenshot) */}
      <div className="bg-[#111116] border border-[#282417] rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#282417]/50 mb-3">
          <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
          <button
            onClick={onNavigateToRecords}
            className="text-xs text-[#E6B92F] hover:underline font-semibold"
          >
            View all
          </button>
        </div>

        <div className="divide-y divide-[#282417]/40">
          {recentActivities.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#A5A5AE]">
              No activity recorded in this session.
            </div>
          ) : (
            recentActivities.map((act) => {
              const dateObj = new Date(act.createdAt);
              const formattedDate = dateObj.toLocaleDateString([], {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={act.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-[#181822]/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#181822] border border-[#282417] flex items-center justify-center text-[#E6B92F] shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {act.title}
                      </h4>
                      <span className="text-[10px] text-[#A5A5AE] mt-0.5 block">
                        {formattedDate}, {formattedTime}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#21D39B] tabular-nums">
                      +${act.amount.toFixed(2)}
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
