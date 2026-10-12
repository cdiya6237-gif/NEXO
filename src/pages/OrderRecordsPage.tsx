import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Package, RotateCcw } from 'lucide-react';
import { User, UserCycleState, CycleOrder } from '../types';
import { store } from '../services/store';

interface OrderRecordsPageProps {
  currentUser: User;
}

export const OrderRecordsPage: React.FC<OrderRecordsPageProps> = ({ currentUser }) => {
  const [cycle, setCycle] = useState<UserCycleState>(store.getUserCycleState(currentUser.id));

  const refreshState = () => {
    setCycle(store.getUserCycleState(currentUser.id));
  };

  useEffect(() => {
    refreshState();
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (key && !['orders', 'server_sync', 'broadcast'].includes(key)) {
        return;
      }
      refreshState();
    };
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, [currentUser?.id]);

  // Filter completed orders and sort descending by orderNumber (#25 down to #1)
  const completedOrders = [...cycle.orders]
    .filter(o => o.status === 'completed')
    .sort((a, b) => b.orderNumber - a.orderNumber);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Container card matching Screenshot 8 */}
      <div className="bg-[#111116] border border-[#3A321C]/70 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#282417]/60 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Completed Orders ({completedOrders.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181822] text-[#E6B92F] border border-[#282417] font-semibold">
              Order Complete {completedOrders.length} of 25
            </span>
          </div>

          <span className="text-xs text-[#A5A5AE]">
            {completedOrders.length === 25 ? 'All 25 Verified' : `${completedOrders.length} of 25 Submitted`}
          </span>
        </div>

        {completedOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#181822] text-[#A5A5AE] flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Completed Orders Yet</h4>
            <p className="text-xs text-[#A5A5AE] max-w-sm mx-auto">
              Start submitting orders in the Orders tab to populate your order records.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {completedOrders.map((ord) => (
              <div
                key={ord.orderNumber}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#16161e] hover:bg-[#1a1a24] border border-[#282417]/70 flex items-center justify-between gap-4 transition-colors"
              >
                {/* Left: Green checkmark + Order details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#21D39B]/15 border border-[#21D39B]/40 text-[#21D39B] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      Order #{ord.orderNumber}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-[#A5A5AE] truncate">
                      {ord.productName}
                    </p>
                  </div>
                </div>

                {/* Right: Price + Commission */}
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-white tabular-nums">
                    ${ord.orderAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-[#21D39B] tabular-nums mt-0.5">
                    +${ord.estimatedCommission.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
