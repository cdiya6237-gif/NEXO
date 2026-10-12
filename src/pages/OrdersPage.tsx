import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  TrendingUp,
  Package,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { User, UserCycleState, CycleOrder } from '../types';
import { store } from '../services/store';

interface OrdersPageProps {
  currentUser: User;
  onNavigateToWallet: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  currentUser,
  onNavigateToWallet,
}) => {
  const [cycle, setCycle] = useState<UserCycleState>(store.getUserCycleState(currentUser.id));
  const [wallet, setWallet] = useState(store.getWalletMetrics(currentUser.id));
  const [isMatching, setIsMatching] = useState(false);
  const [matchingStep, setMatchingStep] = useState('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<CycleOrder | null>(null);
  const [insufficientBalanceError, setInsufficientBalanceError] = useState<string | null>(null);

  const refreshState = () => {
    setCycle(store.getUserCycleState(currentUser.id));
    setWallet(store.getWalletMetrics(currentUser.id));
  };

  useEffect(() => {
    refreshState();
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (
        key &&
        !['orders', 'user_balances', 'silver_products', 'gold_products', 'current_user', 'users', 'server_sync', 'broadcast'].includes(key)
      ) {
        return;
      }
      refreshState();
    };
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, [currentUser?.id, currentUser?.tier]);

  const currentOrder: CycleOrder | undefined =
    cycle.isCompleted ? undefined : cycle.orders[cycle.currentOrderIndex];

  // Submit Order flow (Section 23, 24, 25)
  const handleSubmitOrder = () => {
    if (!currentOrder || isMatching) return;

    // IMMEDIATE CHECK: If customer does not have enough balance, show Insufficient Balance in RED immediately upon clicking Submit Order!
    if (wallet.available < currentOrder.orderAmount) {
      setInsufficientBalanceError(
        `Insufficient Balance: Order #${currentOrder.orderNumber} requires $${currentOrder.orderAmount.toFixed(2)} in Available Balance, but your current balance is $${wallet.available.toFixed(2)}. Please deposit funds to complete this order.`
      );
      return;
    }

    setInsufficientBalanceError(null);
    setIsMatching(true);
    setMatchingStep('Connecting to Merchant Dispatch...');

    setTimeout(() => {
      setMatchingStep('Matching with Seller...');
    }, 600);

    setTimeout(() => {
      setMatchingStep('Allocating Commission Clearing...');
    }, 1100);

    setTimeout(() => {
      const result = store.submitCycleOrder(currentUser.id, currentOrder.orderNumber);
      setIsMatching(false);
      if (result.success === false) {
        setInsufficientBalanceError(result.error || 'Insufficient Balance to clear this order.');
      } else {
        setLastCompletedOrder(currentOrder);
      }
      refreshState();
    }, 1600);
  };

  // Reset cycle manually to demonstrate fresh 25 tasks
  const handleStartNewCycle = () => {
    store.resetUserCycle(currentUser.id);
    setLastCompletedOrder(null);
    refreshState();
  };

  // Calculate today's total commission for all completed orders
  const completedOrders = cycle.orders.filter((o: CycleOrder) => o.status === 'completed');
  const todayCommission = completedOrders.reduce((sum: number, o: CycleOrder) => sum + o.estimatedCommission, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Header Information */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282417]/60">
        <div>
          <span className="text-xs text-[#A5A5AE] uppercase tracking-wider font-semibold">
            Task Pipeline
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#E6B92F] tracking-tight">
            {cycle.isCompleted
              ? 'Order Complete 25 of 25'
              : `Order Complete ${completedOrders.length} of 25`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#181822] border border-[#E6B92F]/40 text-[#E6B92F] text-xs font-bold uppercase tracking-wider shadow-sm">
            {currentUser.vipLevel || 'VIP 1'}
          </span>
        </div>
      </div>

      {/* Matching with Seller Animation Overlay / Modal */}
      {isMatching && (
        <div className="bg-[#111116] border border-[#E6B92F]/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#E6B92F]/20 animate-ping" />
            <div className="w-16 h-16 rounded-full bg-[#1c1708] border border-[#E6B92F] flex items-center justify-center text-[#E6B92F] shadow-[0_0_20px_rgba(230,185,47,0.4)]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {matchingStep}
            </h3>
            <p className="text-xs text-[#A5A5AE] max-w-sm mx-auto">
              Routing merchant inventory and locking 25% verified commission onto your balance.
            </p>
          </div>
        </div>
      )}

      {/* Cycle Completed View (Matches Reference Screenshot 7) */}
      {!isMatching && cycle.isCompleted && (
        <div className="bg-[#111116] border border-[#3A321C] rounded-3xl p-6 sm:p-10 text-center shadow-xl space-y-6 max-w-xl mx-auto">
          {/* Green Checkmark Circle */}
          <div className="w-20 h-20 rounded-full bg-[#21D39B]/20 border-2 border-[#21D39B] text-[#21D39B] mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(33,211,155,0.25)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Order Summary
            </h3>
            <p className="text-xs sm:text-sm text-[#A5A5AE] max-w-md mx-auto leading-relaxed">
              Order Complete 25 of 25! All tasks verified.
            </p>
          </div>

          {/* Financial Totals */}
          <div className="bg-[#181822] border border-[#282417] rounded-2xl p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-[#282417]/50">
              <span className="text-[#A5A5AE] font-medium">Today's Commission:</span>
              <span className="text-[#21D39B] font-bold text-sm sm:text-base tabular-nums">
                ${todayCommission.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm py-1">
              <span className="text-[#A5A5AE] font-medium">Current Balance:</span>
              <span className="text-white font-extrabold text-sm sm:text-base tabular-nums">
                ${wallet.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onNavigateToWallet}
              className="w-full py-3.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(230,185,47,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Wallet to Withdraw</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartNewCycle}
              className="w-full py-2.5 rounded-xl bg-[#181822] hover:bg-[#20202d] text-[#A5A5AE] hover:text-[#E6B92F] border border-[#282417] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Start New 25 Orders</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Order Card View (Matches Specification Section 21) */}
      {!isMatching && !cycle.isCompleted && currentOrder && (
        <div className="bg-[#111116] border border-[#3A321C] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-[#A5A5AE]">
              <span>Progress</span>
              <span className="text-[#E6B92F] font-bold">
                Order Complete {currentOrder.orderNumber - 1} of 25 ({Math.round(((currentOrder.orderNumber - 1) / 25) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#181822] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E6B92F]/60 to-[#E6B92F] transition-all duration-300"
                style={{ width: `${((currentOrder.orderNumber - 1) / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Card Content */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#16161e] border border-[#282417]/80">
            {/* Product Image */}
            <div className="w-full sm:w-48 h-44 rounded-xl overflow-hidden bg-[#0c0c10] border border-[#282417] relative shrink-0">
              {currentOrder.imageUrl ? (
                <img
                  src={currentOrder.imageUrl}
                  alt={currentOrder.productName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#A5A5AE]">
                  <Package className="w-10 h-10" />
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-[#E6B92F] border border-[#E6B92F]/30">
                {currentOrder.marketplace}
              </span>
            </div>

            {/* Product Info & Pricing */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-[#A5A5AE] uppercase tracking-wider">
                  {currentOrder.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 leading-snug">
                  {currentOrder.productName}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#282417]/60">
                {/* Order Amount */}
                <div className="bg-[#111116] p-2.5 rounded-xl border border-[#282417]">
                  <span className="text-[10px] text-[#A5A5AE] block">Order Amount</span>
                  <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
                    ${currentOrder.orderAmount.toFixed(2)}
                  </span>
                </div>

                {/* Commission Rate */}
                <div className="bg-[#111116] p-2.5 rounded-xl border border-[#282417]">
                  <span className="text-[10px] text-[#A5A5AE] block">Commission</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#E6B92F]">
                    {(currentOrder.commissionRate * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Estimated Commission */}
                <div className="bg-[#111116] p-2.5 rounded-xl border border-[#282417]">
                  <span className="text-[10px] text-[#A5A5AE] block">Est. Reward</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#21D39B] tabular-nums">
                    +${currentOrder.estimatedCommission.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Red Alert: Insufficient Balance Error */}
          {insufficientBalanceError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-in fade-in duration-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                  <span className="text-sm font-black text-red-400 uppercase tracking-wider">
                    Insufficient Balance
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-500/50">
                  Required: ${currentOrder.orderAmount.toFixed(2)}
                </span>
              </div>

              <p className="text-xs font-semibold text-red-200 leading-relaxed">
                {insufficientBalanceError}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-red-800/60">
                <div className="text-[11px] text-red-300">
                  <span>Available Balance: </span>
                  <strong className="text-white font-mono">${wallet.available.toFixed(2)}</strong>
                  <span className="mx-1">•</span>
                  <span>Shortfall: </span>
                  <strong className="text-red-400 font-mono">
                    ${Math.max(0, currentOrder.orderAmount - wallet.available).toFixed(2)} USDT
                  </strong>
                </div>

                <button
                  onClick={onNavigateToWallet}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Deposit Funds Now →</span>
                </button>
              </div>
            </div>
          )}

          {/* Prominent Action Button (Section 23: Text must remain black against gold button) */}
          <div className="pt-2 flex flex-col items-center">
            <button
              onClick={handleSubmitOrder}
              disabled={isMatching}
              className="w-full sm:w-72 py-4 rounded-2xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-sm uppercase tracking-wider transition-all transform hover:scale-102 active:scale-98 shadow-[0_4px_25px_rgba(230,185,47,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black/20" />
              <span>Submit Order</span>
            </button>
            <span className="text-[10px] text-[#A5A5AE] mt-2">
              Submits task clearance and credits instant 25% commission.
            </span>
          </div>
        </div>
      )}

      {/* Previous Order Summary (Section 25) */}
      {lastCompletedOrder && !cycle.isCompleted && (
        <div className="bg-[#111116]/80 border border-[#282417] rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#21D39B]/20 text-[#21D39B] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Order #{lastCompletedOrder.orderNumber} Completed</span>
              <p className="text-[#A5A5AE] text-[11px] truncate max-w-xs">{lastCompletedOrder.productName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[#21D39B] font-bold text-xs block">
              +${lastCompletedOrder.estimatedCommission.toFixed(2)}
            </span>
            <span className="text-[9px] text-[#A5A5AE]">Collected</span>
          </div>
        </div>
      )}
    </div>
  );
};
