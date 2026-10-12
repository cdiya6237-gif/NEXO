import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  QrCode,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  FileText,
  DollarSign,
} from 'lucide-react';
import { User, Transaction, DepositRequest, WithdrawalRequest, CycleOrder } from '../types';
import { store } from '../services/store';

export type WalletSubTab = 'overview' | 'deposit' | 'withdraw' | 'history';

interface WalletPageProps {
  currentUser: User;
  initialTab?: WalletSubTab;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  currentUser,
  initialTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<WalletSubTab>(initialTab);
  const [wallet, setWallet] = useState(store.getWalletMetrics(currentUser.id));
  const [cycle, setCycle] = useState(store.getUserCycleState(currentUser.id));
  const [trc20Address, setTrc20Address] = useState(store.getPlatformTRC20Address());
  const [copied, setCopied] = useState(false);

  // Deposit Form State
  const [depositMethod, setDepositMethod] = useState<'Manual Wallet TRC20' | 'Payment Now Gate'>('Manual Wallet TRC20');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [depositMessage, setDepositMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Withdraw Form State
  const [withdrawAddress, setWithdrawAddress] = useState(currentUser.withdrawAddress || '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // History Filter
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'commission'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userDeposits, setUserDeposits] = useState<DepositRequest[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);

  const refreshWalletData = () => {
    setWallet(store.getWalletMetrics(currentUser.id));
    setCycle(store.getUserCycleState(currentUser.id));
    setTrc20Address(store.getPlatformTRC20Address());
    setTransactions(store.getTransactions(currentUser.id));
    setUserDeposits(store.getDeposits().filter(d => d.userId === currentUser.id));
    setUserWithdrawals(store.getWithdrawals().filter(w => w.userId === currentUser.id));
  };

  useEffect(() => {
    refreshWalletData();
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (
        key &&
        !['user_balances', 'deposits', 'withdrawals', 'transactions', 'trc20_address', 'server_sync', 'broadcast'].includes(key)
      ) {
        return;
      }
      refreshWalletData();
    };
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, [currentUser?.id]);

  // Copy address to clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(trc20Address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Deposit Submit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositMessage(null);
    const amountNum = parseFloat(depositAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setDepositMessage({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }

    if (!depositTxHash.trim()) {
      setDepositMessage({ type: 'error', text: 'Please submit your TRC20 transaction hash.' });
      return;
    }

    store.submitDeposit({
      userId: currentUser.id,
      username: currentUser.username,
      userFullName: currentUser.fullName,
      amount: amountNum,
      method: depositMethod,
      trc20Address,
      txHash: depositTxHash.trim(),
      receiptFileName: receiptFile ? receiptFile.name : undefined,
    });

    setDepositAmount('');
    setDepositTxHash('');
    setReceiptFile(null);
    setDepositMessage({
      type: 'success',
      text: 'Deposit request submitted successfully! Status is Pending admin review.',
    });
    refreshWalletData();
  };

  // Withdraw Submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMessage(null);
    const amountNum = parseFloat(withdrawAmount);

    if (!withdrawAddress.trim()) {
      setWithdrawMessage({ type: 'error', text: 'Please enter a valid TRC20 destination address.' });
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawMessage({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }

    // REQUIREMENT:
    // If the customer has not yet completed all 25 orders, the withdrawal request must not be processed.
    // After the customer submits the withdrawal request, show a clear notification:
    // “Please complete all 25 orders before you can withdraw your funds.”
    const completedCount = cycle.orders.filter((o: CycleOrder) => o.status === 'completed').length;
    if (!cycle.isCompleted || completedCount < 25) {
      setWithdrawMessage({
        type: 'error',
        text: 'Please complete all 25 orders before you can withdraw your funds.',
      });
      return;
    }

    if (amountNum < 50) {
      setWithdrawMessage({ type: 'error', text: 'Minimum withdrawal amount is $50.00 USDT.' });
      return;
    }

    if (amountNum > wallet.available) {
      setWithdrawMessage({ type: 'error', text: 'Insufficient available balance.' });
      return;
    }

    const res = store.submitWithdrawal(currentUser.id, amountNum, withdrawAddress.trim());
    if (res.success) {
      setWithdrawAmount('');
      setWithdrawMessage({
        type: 'success',
        text: 'Withdrawal request submitted! It will be reviewed and disbursed by the finance desk.',
      });
      refreshWalletData();
    } else {
      setWithdrawMessage({ type: 'error', text: res.error || 'Failed to submit withdrawal.' });
    }
  };

  // Filter transactions
  const filteredTxs = transactions.filter((t) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'deposit') return t.type === 'deposit';
    if (historyFilter === 'withdrawal') return t.type === 'withdrawal';
    if (historyFilter === 'commission') return t.type === 'order_commission' || t.type === 'commission' || t.type === 'referral_bonus';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* 1. WALLET SUMMARY CARD (Matches Screenshot 9, 10, 11) */}
      <div className="bg-[#111116] border border-[#3A321C]/80 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#A5A5AE]">
          WALLET SUMMARY
        </span>

        {/* Primary Row: Available, Held, Pending Commission */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#282417]/60">
          <div>
            <span className="text-[11px] text-[#A5A5AE] block">Available</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              ${wallet.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#A5A5AE] block">Held</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              ${wallet.held.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#A5A5AE] block">Pending Commission</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#21D39B] tracking-tight tabular-nums">
              ${wallet.pendingCommission.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Secondary Row: Total Earned, Total Withdrawn */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-[#A5A5AE] block">Total Earned</span>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
              ${wallet.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#A5A5AE] block">Total Withdrawn</span>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
              ${wallet.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Exactly Four Main Tabs (Section 34) */}
      <div className="flex items-center justify-between p-1 bg-[#111116] border border-[#282417] rounded-2xl">
        {(['overview', 'deposit', 'withdraw', 'history'] as WalletSubTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label =
            tab === 'overview'
              ? 'Overview'
              : tab === 'deposit'
              ? 'Deposit'
              : tab === 'withdraw'
              ? 'Withdraw'
              : 'History';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all capitalize ${
                isActive
                  ? 'bg-[#181822] text-[#E6B92F] shadow-sm border border-[#282417]'
                  : 'text-[#A5A5AE] hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW (Screenshot 10) */}
      {activeTab === 'overview' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('deposit')}
              className="py-3 px-4 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit USDT</span>
            </button>

            <button
              onClick={() => setActiveTab('withdraw')}
              className="py-3 px-4 rounded-xl bg-[#181822] hover:bg-[#20202d] border border-[#282417] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 text-[#E6B92F]" />
              <span>Withdraw</span>
            </button>
          </div>

          {/* Weekly Activity Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white tracking-tight">Weekly Activity</h4>

            <div className="bg-[#16161e] border border-[#282417] rounded-2xl p-5">
              <div className="h-32 flex items-end justify-between gap-2 pt-6 px-4">
                {[
                  { day: 'Mon', dep: 0, with: 0 },
                  { day: 'Tue', dep: 0, with: 0 },
                  { day: 'Wed', dep: 250, with: 0 },
                  { day: 'Thu', dep: 0, with: 0 },
                  { day: 'Fri', dep: 0, with: 0 },
                  { day: 'Sat', dep: 0, with: 0 },
                  { day: 'Sun', dep: 0, with: 0 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    <div className="w-full flex items-end justify-center h-20">
                      {item.dep > 0 ? (
                        <div
                          className="w-4 sm:w-8 bg-[#E6B92F] rounded-t-md transition-all group-hover:brightness-125"
                          style={{ height: `${Math.min(100, (item.dep / 300) * 80)}px` }}
                          title={`Deposit: $${item.dep}`}
                        />
                      ) : (
                        <div className="w-4 sm:w-8 h-1 bg-[#282417] rounded-t-sm" />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-[#A5A5AE] group-hover:text-white">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#282417]/50 text-xs text-[#A5A5AE]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E6B92F]" />
                  <span>Deposit ($250.00 Wed)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]" />
                  <span>Withdrawal ($0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPOSIT (Screenshot 9) */}
      {activeTab === 'deposit' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Deposit USDT (TRC20)</h3>
            <p className="text-xs text-[#A5A5AE] mt-1">
              Send USDT TRC20 to the address below and submit your transaction hash.
            </p>
          </div>

          {/* Address Box */}
          <div className="p-4 rounded-2xl bg-[#16161e] border border-[#282417] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#111116] border border-[#282417] flex items-center justify-center text-[#E6B92F] shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-[#A5A5AE] block">TRC20 Wallet Address</span>
                <span className="text-xs font-mono font-bold text-[#E6B92F] tracking-wide select-all truncate block">
                  {trc20Address}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyAddress}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#181822] hover:bg-[#20202d] text-white border border-[#282417] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#21D39B]" />
                  <span className="text-[#21D39B]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#A5A5AE]" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            {depositMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  depositMessage.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border border-red-500/40 text-red-300'
                }`}
              >
                {depositMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#21D39B]" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF4D4D]" />
                )}
                <span>{depositMessage.text}</span>
              </div>
            )}

            {/* Deposit Method Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Deposit Method</label>
              <select
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value as any)}
                className="w-full bg-[#181822] border border-[#282417] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E6B92F]"
              >
                <option value="Manual Wallet TRC20">Manual Wallet (TRC20)</option>
                <option value="Payment Now Gate">Payment Now Gate</option>
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Amount (USDT)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-[#A5A5AE] font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-[#181822] border border-[#282417] rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E6B92F]"
                />
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Transaction Hash</label>
              <input
                type="text"
                required
                value={depositTxHash}
                onChange={(e) => setDepositTxHash(e.target.value)}
                placeholder="Enter TX hash after sending"
                className="w-full bg-[#181822] border border-[#282417] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#E6B92F]"
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Upload Payment Receipt</label>
              <div className="border border-dashed border-[#282417] hover:border-[#E6B92F]/60 rounded-2xl p-6 text-center bg-[#16161e] cursor-pointer relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-7 h-7 text-[#E6B92F] mx-auto mb-2" />
                <p className="text-xs text-white font-medium">
                  {receiptFile ? (
                    <span className="text-[#21D39B] font-bold">{receiptFile.name}</span>
                  ) : (
                    <>
                      Upload payment receipt <span className="text-[#E6B92F]">or browse</span>
                    </>
                  )}
                </p>
                <span className="text-[10px] text-[#A5A5AE] mt-1 block">
                  JPG, PNG, PDF up to 10MB
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
            >
              Submit Deposit Request
            </button>
          </form>

          {/* Pending / Recent Requests for this user */}
          {userDeposits.length > 0 && (
            <div className="pt-4 border-t border-[#282417]/60 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Your Deposit Requests
              </h4>
              <div className="space-y-2">
                {userDeposits.slice(0, 3).map((dep) => (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl bg-[#16161e] border border-[#282417] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">${dep.amount.toFixed(2)} USDT</span>
                      <span className="text-[10px] text-[#A5A5AE] block font-mono">
                        Hash: {dep.txHash.slice(0, 14)}...
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        dep.status === 'approved'
                          ? 'bg-[#21D39B]/20 text-[#21D39B] border border-[#21D39B]/40'
                          : dep.status === 'pending'
                          ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WITHDRAW (Always unlocked, visible, and clickable) */}
      {activeTab === 'withdraw' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282417]/60">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Withdraw USDT</h3>
              <p className="text-xs text-[#A5A5AE] mt-0.5">
                Submit a withdrawal request to your secure TRC20 wallet address.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] px-3 py-1 rounded-full bg-[#181822] border border-[#282417] text-[#E6B92F] font-bold">
                Order Complete {cycle.orders.filter((o: CycleOrder) => o.status === 'completed').length} of 25
              </span>
            </div>
          </div>

              {withdrawMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    withdrawMessage.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/40 text-red-300'
                  }`}
                >
                  {withdrawMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#21D39B]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF4D4D]" />
                  )}
                  <span>{withdrawMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Destination Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A5A5AE]">
                    USDT TRC20 Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Enter TRC20 destination address"
                    className="w-full bg-[#181822] border border-[#282417] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#E6B92F]"
                  />
                </div>

                {/* Available Balance Preview */}
                <div className="p-3 rounded-xl bg-[#16161e] border border-[#282417] flex justify-between items-center text-xs">
                  <span className="text-[#A5A5AE]">Available Balance</span>
                  <span className="font-extrabold text-white text-sm tabular-nums">
                    ${wallet.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A5A5AE]">Amount (USDT)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-[#A5A5AE] font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="50"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Min. $50.00"
                      className="w-full bg-[#181822] border border-[#282417] rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E6B92F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
                >
                  Submit Withdrawal
                </button>
              </form>

              {/* User Previous Withdrawals */}
              {userWithdrawals.length > 0 && (
                <div className="pt-4 border-t border-[#282417]/60 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Withdrawal Requests
                  </h4>
                  <div className="space-y-2">
                    {userWithdrawals.slice(0, 3).map((wth) => (
                      <div
                        key={wth.id}
                        className="p-3 rounded-xl bg-[#16161e] border border-[#282417] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">${wth.amount.toFixed(2)} USDT</span>
                          <span className="text-[10px] text-[#A5A5AE] block font-mono">
                            To: {wth.destinationAddress.slice(0, 10)}...
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            wth.status === 'approved'
                              ? 'bg-[#21D39B]/20 text-[#21D39B] border border-[#21D39B]/40'
                              : wth.status === 'pending'
                              ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </div>
      )}

      {/* TAB 4: HISTORY (Screenshot 12) */}
      {activeTab === 'history' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          {/* Subtabs Filter */}
          <div className="flex items-center gap-2 border-b border-[#282417]/60 pb-3">
            {[
              { id: 'all', label: 'ALL' },
              { id: 'deposit', label: 'DEPOSIT' },
              { id: 'withdrawal', label: 'WITHDRAWAL' },
              { id: 'commission', label: 'COMMISSION' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  historyFilter === f.id
                    ? 'bg-[#181822] text-[#E6B92F] border border-[#282417]'
                    : 'text-[#A5A5AE] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-[#282417]/40 max-h-[600px] overflow-y-auto pr-1">
            {filteredTxs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A5A5AE]">
                No transactions found for this filter.
              </div>
            ) : (
              filteredTxs.map((tx) => {
                const dateObj = new Date(tx.createdAt);
                const dateStr = dateObj.toLocaleDateString([], {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                });
                const timeStr = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isPositive = tx.amount >= 0;

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-[#16161e] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#282417] ${
                          isPositive
                            ? 'bg-[#1c2e26] text-[#21D39B]'
                            : 'bg-[#2a1b1b] text-[#FF4D4D]'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {tx.title}
                          </h4>
                          {tx.tag && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#181822] text-[#21D39B] border border-[#21D39B]/30 font-semibold uppercase tracking-wider shrink-0">
                              {tx.tag}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#A5A5AE] mt-0.5 block truncate">
                          {dateStr}, {timeStr}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isPositive ? 'text-[#21D39B]' : 'text-[#FF4D4D]'
                        }`}
                      >
                        {isPositive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#A5A5AE] block tabular-nums">
                        Bal: ${(tx.balanceAfter ?? tx.availableBalanceAfter).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
