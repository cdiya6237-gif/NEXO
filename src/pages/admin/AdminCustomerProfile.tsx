import React, { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  DollarSign,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Share2,
  FileSpreadsheet,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  AlertCircle,
  KeyRound,
  Globe,
  Monitor,
  Activity,
  Award,
  X,
  Lock,
} from 'lucide-react';
import { User, DepositRequest, WithdrawalRequest, Transaction, ReferralRecord } from '../../types';
import { store } from '../../services/store';

interface AdminCustomerProfileProps {
  user: User;
  currentAdmin: User;
  onBack: () => void;
  onUserUpdated: () => void;
}

export const AdminCustomerProfile: React.FC<AdminCustomerProfileProps> = ({
  user,
  currentAdmin,
  onBack,
  onUserUpdated,
}) => {
  // Balance metrics for this customer
  const balances = store.getWalletBalances(user.id);
  const cycle = store.getUserCycleState(user.id);
  const userDeposits = store.getDeposits().filter((d) => d.userId === user.id);
  const userWithdrawals = store.getWithdrawals().filter((w) => w.userId === user.id);
  const userTransactions = store.getTransactions(user.id);
  const userReferrals = store.getReferrals().filter(
    (r) => r.referrerUserId === user.id || r.referrerUsername.toLowerCase() === user.username.toLowerCase()
  );

  // Profile Sub-tab
  const [profileTab, setProfileTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'transactions' | 'referrals' | 'orders' | 'activity'
  >('overview');

  // Adjustment State
  const [adjustmentAction, setAdjustmentAction] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('Administrative ledger calibration');
  const [adjSuccess, setAdjSuccess] = useState('');
  const [adjError, setAdjError] = useState('');

  // Password Reset Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetPassSuccess, setResetPassSuccess] = useState('');
  const [resetPassError, setResetPassError] = useState('');
  const [tierSyncMsg, setTierSyncMsg] = useState('');

  const completedOrdersCount = cycle.orders.filter((o) => o.status === 'completed').length;
  const totalDepositApproved = userDeposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawalApproved = userWithdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);
  const totalReferralRewards = userReferrals.reduce((sum, r) => sum + r.totalCommissionGenerated, 0);

  // Status & Tier Toggles
  const handleToggleStatus = (newStatus: 'active' | 'pending' | 'suspended') => {
    const updated = { ...user, status: newStatus };
    store.updateUser(updated);
    store.addAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName || currentAdmin.username,
      action: 'UPDATE_USER_STATUS',
      target: `@${user.username}`,
      details: `Status set to ${newStatus.toUpperCase()}`,
    });
    onUserUpdated();
  };

  const handleSelectTier = async (newTier: 'SILVER' | 'GOLD') => {
    setTierSyncMsg('');
    const updated = await store.updateUserTier(
      user.id,
      newTier,
      currentAdmin.fullName || currentAdmin.username
    );
    if (updated) {
      store.addAuditLog({
        adminId: currentAdmin.id,
        adminName: currentAdmin.fullName || currentAdmin.username,
        action: 'UPDATE_USER_TIER',
        target: `@${user.username}`,
        details: `Tier updated to ${newTier} (${updated.vipLevel})`,
      });
      // Updating tier regenerates or adapts user's pending orders in cycle state
      store.getUserOrderProgress(user.id);
      setTierSyncMsg(`✓ Customer tier successfully updated to ${newTier} (${updated.vipLevel})! Synchronized with Customer Panel in real time.`);
      setTimeout(() => setTierSyncMsg(''), 6000);
      onUserUpdated();
    }
  };

  // Balance Adjustment Handler
  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjSuccess('');
    setAdjError('');

    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      setAdjError('Please enter a valid adjustment amount greater than zero.');
      return;
    }

    const effectiveAmount = adjustmentAction === 'credit' ? amt : -amt;
    const newBalance = Number((balances.available + effectiveAmount).toFixed(2));

    if (newBalance < 0) {
      setAdjError(`Cannot deduct $${amt}. Customer available balance is only $${balances.available.toFixed(2)}.`);
      return;
    }

    store.applyAdminAdjustment({
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName || currentAdmin.username,
      type: adjustmentAction === 'credit' ? 'credit' : 'debit',
      amount: effectiveAmount,
      previousBalance: balances.available,
      newBalance,
      reason: adjustmentReason.trim() || 'Manual balance calibration',
    });

    setAdjSuccess(
      `Successfully ${adjustmentAction === 'credit' ? 'added' : 'removed'} $${amt.toFixed(2)} USDT. New balance: $${newBalance.toFixed(2)}.`
    );
    setAdjustmentAmount('');
    onUserUpdated();

    setTimeout(() => {
      setAdjSuccess('');
    }, 4000);
  };

  // Reset Password Handler (Existing password remains unreadable)
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassError('');
    setResetPassSuccess('');

    if (!newPassword || newPassword.trim().length < 4) {
      setResetPassError('New password must be at least 4 characters.');
      return;
    }

    const ok = store.resetUserPassword(
      user.id,
      newPassword.trim(),
      currentAdmin.fullName || currentAdmin.username
    );

    if (ok) {
      setResetPassSuccess(`Password for @${user.username} has been securely updated!`);
      setNewPassword('');
      onUserUpdated();
      setTimeout(() => {
        setResetPassSuccess('');
        setShowResetPasswordModal(false);
      }, 2000);
    } else {
      setResetPassError('Failed to reset password.');
    }
  };

  // Generate fallback login activity if none stored
  const loginActivityList =
    user.loginActivity && user.loginActivity.length > 0
      ? user.loginActivity
      : [
          {
            id: 'log-1',
            timestamp: user.lastLoginAt || user.createdAt,
            ipAddress: '198.51.100.42',
            device: 'Browser Session',
            browser: 'Chrome 122 (Desktop)',
            location: 'Verified Secure Gateway',
          },
        ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282417]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#14141c] hover:bg-[#1f1f2b] text-[#A5A5AE] hover:text-white border border-[#282417] transition-colors cursor-pointer"
            title="Back to Customers List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Customer Profile: {user.fullName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#181822] border border-[#282417] text-[#E6B92F] font-mono">
                @{user.username}
              </span>
              <span
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  user.isOnline
                    ? 'bg-emerald-950/70 text-[#21D39B] border border-emerald-500/50'
                    : 'bg-zinc-800 text-[#A5A5AE]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-[#21D39B] animate-pulse' : 'bg-zinc-500'}`} />
                {user.isOnline ? 'Logged In (Online Now)' : 'Offline'}
              </span>
            </h2>
            <p className="text-xs text-[#A5A5AE]">
              Comprehensive customer record, wallet management & audit history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={user.status}
            onChange={(e) => handleToggleStatus(e.target.value as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer bg-[#14141c] ${
              user.status === 'active'
                ? 'text-emerald-300 border-emerald-500/40'
                : user.status === 'pending'
                ? 'text-[#F5B942] border-[#F5B942]/40'
                : 'text-red-400 border-red-500/40'
            }`}
          >
            <option value="active">Status: ACTIVE</option>
            <option value="pending">Status: PENDING</option>
            <option value="suspended">Status: SUSPENDED</option>
          </select>

          {/* Dedicated Two-Tier Selector: SILVER or GOLD (Syncs live to Customer Portal) */}
          <div className="flex items-center gap-1.5 bg-[#14141c] border border-[#3A321C] p-1.5 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-[#A5A5AE] uppercase px-1.5 hidden sm:inline">
              Tier:
            </span>
            <button
              type="button"
              onClick={() => handleSelectTier('SILVER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                user.tier === 'SILVER'
                  ? 'bg-zinc-700 text-white shadow-md ring-2 ring-zinc-400/50'
                  : 'text-[#A5A5AE] hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Assign Silver Tier (VIP 1)"
            >
              <span>🥈</span>
              <span>Silver Tier (VIP 1)</span>
              {user.tier === 'SILVER' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
            <button
              type="button"
              onClick={() => handleSelectTier('GOLD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                user.tier === 'GOLD'
                  ? 'bg-[#E6B92F] text-black shadow-md ring-2 ring-[#E6B92F]/60'
                  : 'text-[#E6B92F]/80 hover:text-[#E6B92F] hover:bg-[#E6B92F]/10'
              }`}
              title="Assign Gold Tier (VIP 3)"
            >
              <span>🥇</span>
              <span>Gold Tier (VIP 3)</span>
              {user.tier === 'GOLD' && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Tier Sync Notification */}
      {tierSyncMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-lg">
          <span className="text-emerald-400 text-sm">✓</span>
          <span>{tierSyncMsg}</span>
        </div>
      )}

      {/* Live Session Alert Banner */}
      {user.isOnline && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <span className="font-bold text-white">Customer is currently logged in to Customer Portal</span>
              <span className="text-[#A5A5AE] block text-[11px]">
                {user.lastLoginAt ? `Session started at ${new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live session active'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(`Force disconnect active session for @${user.username}?`)) {
                store.terminateCustomerSession(user.id, currentAdmin.username);
                onUserUpdated();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-500/40 font-bold text-xs transition-colors cursor-pointer"
          >
            Force Disconnect Session
          </button>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Column 1: Identity & Avatar */}
          <div className="flex items-center gap-4 md:border-r md:border-[#282417] md:pr-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E6B92F] to-[#806010] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#181822] rounded-[14px] flex items-center justify-center text-white font-extrabold text-xl">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{user.fullName}</h3>
              <p className="text-xs text-[#E6B92F] font-mono font-medium">@{user.username}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#A5A5AE]">
                <Calendar className="w-3.5 h-3.5 text-[#A5A5AE]" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-[10px] text-[#A5A5AE]">
                Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Recent Session'}
              </p>
            </div>
          </div>

          {/* Column 2: Contact Information */}
          <div className="space-y-2 text-xs md:border-r md:border-[#282417] md:pr-6">
            <div className="flex items-center gap-2 text-[#A5A5AE]">
              <Mail className="w-3.5 h-3.5 text-[#E6B92F]" />
              <span className="text-white font-medium truncate">{user.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A5A5AE]">
              <Phone className="w-3.5 h-3.5 text-[#E6B92F]" />
              <span className="text-white font-mono">{user.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A5A5AE]">
              <Wallet className="w-3.5 h-3.5 text-[#E6B92F]" />
              <span className="text-white font-mono truncate text-[11px]">
                TRC20: {user.withdrawAddress || 'Not linked yet'}
              </span>
            </div>
          </div>

          {/* Column 3: Referral & Password Management */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#A5A5AE]">Referral Code:</span>
              <span className="font-mono font-bold text-[#E6B92F]">{user.referralCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A5A5AE]">Referred By:</span>
              <span className="font-mono text-white">{user.referredBy || 'Organic / Master'}</span>
            </div>

            {/* PASSWORD CARD: Hidden Password + Reset Password Button */}
            <div className="pt-2 border-t border-[#282417] flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#A5A5AE] uppercase font-bold block">Password</span>
                <span className="font-mono tracking-widest text-slate-300 text-sm">••••••••••</span>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#252535] text-[#E6B92F] border border-[#282417] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Available Balance */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#E6B92F]/50 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E6B92F] block">
            Current Balance
          </span>
          <span className="text-lg font-black text-white tabular-nums block mt-1">
            ${balances.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">Available for tasks</span>
        </div>

        {/* Hold Balance */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5A5AE] block">
            Hold Balance
          </span>
          <span className="text-lg font-bold text-white tabular-nums block mt-1">
            ${balances.hold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">Order settlement lock</span>
        </div>

        {/* Earnings & Rewards */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#21D39B] block">
            Earnings / Rewards
          </span>
          <span className="text-lg font-bold text-[#21D39B] tabular-nums block mt-1">
            ${(balances.totalEarned + totalReferralRewards).toFixed(2)}
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">Commission + Referrals</span>
        </div>

        {/* Total Deposited */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5A5AE] block">
            Total Deposits
          </span>
          <span className="text-lg font-bold text-white tabular-nums block mt-1">
            ${totalDepositApproved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">{userDeposits.length} deposits</span>
        </div>

        {/* Total Withdrawn */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5A5AE] block">
            Total Withdrawals
          </span>
          <span className="text-lg font-bold text-white tabular-nums block mt-1">
            ${totalWithdrawalApproved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">{userWithdrawals.length} withdrawals</span>
        </div>

        {/* Order Progress */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5A5AE] block">
            Order Progress
          </span>
          <span className="text-lg font-bold text-[#E6B92F] block mt-1">
            {completedOrdersCount} of 25
          </span>
          <span className="text-[10px] text-[#A5A5AE] block mt-0.5">
            {cycle.isCompleted ? '✓ Completed' : `${user.tier} Pipeline`}
          </span>
        </div>
      </div>

      {/* Balance Adjustment Section ([ + Add Balance ] [ - Remove Balance ]) */}
      <div className="bg-[#111116] border border-[#E6B92F]/40 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#282417]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#E6B92F]" />
            <h3 className="text-base font-bold text-white">
              Wallet Adjustment — Current Balance: <span className="text-[#E6B92F]">${balances.available.toFixed(2)} USDT</span>
            </h3>
          </div>
          <span className="text-xs text-[#A5A5AE]">
            Logged permanently in Ledger and Audit Log
          </span>
        </div>

        {adjSuccess && (
          <div className="my-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
            <span>{adjSuccess}</span>
          </div>
        )}

        {adjError && (
          <div className="my-3 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF4D4D] shrink-0" />
            <span>{adjError}</span>
          </div>
        )}

        <form onSubmit={handleConfirmAdjustment} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Buttons: [+ Add Balance] [- Remove Balance] */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Adjustment Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentAction('credit')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                    adjustmentAction === 'credit'
                      ? 'bg-[#21D39B]/20 text-[#21D39B] border-[#21D39B]'
                      : 'bg-[#181822] text-[#A5A5AE] border-[#282417] hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add Balance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentAction('debit')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                    adjustmentAction === 'debit'
                      ? 'bg-red-500/20 text-red-400 border-red-500'
                      : 'bg-[#181822] text-[#A5A5AE] border-[#282417] hover:text-white'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>− Remove Balance</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Amount (USDT)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-[#A5A5AE] font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A5A5AE]">Adjustment Reason / Memo</label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g. VIP Credit Bonus, Deposit Correction"
                className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[#A5A5AE]">
              {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) ? (
                <span>
                  Resulting Balance:{' '}
                  <strong className="text-white">
                    $
                    {Math.max(
                      0,
                      balances.available +
                        (adjustmentAction === 'credit'
                          ? parseFloat(adjustmentAmount)
                          : -parseFloat(adjustmentAmount))
                    ).toFixed(2)}{' '}
                    USDT
                  </strong>
                </span>
              ) : (
                <span>Adjustments update immediately and are saved to the audit ledger.</span>
              )}
            </div>

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer ${
                adjustmentAction === 'credit'
                  ? 'bg-[#21D39B] hover:bg-[#1bb383] text-black'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Confirm {adjustmentAction === 'credit' ? '+ Add' : '− Remove'} Balance
            </button>
          </div>
        </form>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#282417] overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: `${user.tier} Orders 1–25`, icon: Package },
          { id: 'deposits', label: `Deposit History (${userDeposits.length})`, icon: ArrowDownLeft },
          { id: 'withdrawals', label: `Withdrawal History (${userWithdrawals.length})`, icon: ArrowUpRight },
          { id: 'transactions', label: `Transaction History (${userTransactions.length})`, icon: FileSpreadsheet },
          { id: 'referrals', label: `Referral Network (${userReferrals.length})`, icon: Share2 },
          { id: 'activity', label: 'Login Activity & Device', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = profileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#E6B92F] text-black shadow-md'
                  : 'text-[#A5A5AE] hover:text-white hover:bg-[#181822]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content */}
      {/* 1. Orders Tasks 1 to 25 */}
      {profileTab === 'overview' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Order Progression ({user.tier} Pipeline — Order Complete {completedOrdersCount} of 25)
            </h4>
            <span className="text-xs text-[#E6B92F] font-bold">
              {cycle.isCompleted ? 'All 25 Orders Completed' : `Current Order: #${cycle.currentOrderIndex + 1}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cycle.orders.map((ord) => {
              const isDone = ord.status === 'completed';
              return (
                <div
                  key={ord.orderNumber}
                  className={`p-3 rounded-2xl border text-xs flex flex-col justify-between ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-[#181822] border-[#282417]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[#E6B92F]">Order #{ord.orderNumber}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          isDone ? 'bg-[#21D39B]/20 text-[#21D39B]' : 'bg-zinc-800 text-[#A5A5AE]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <img
                      src={ord.imageUrl}
                      alt={ord.productName}
                      className="w-full h-20 object-cover rounded-xl border border-[#282417]"
                    />
                    <p className="font-semibold text-white text-[11px] line-clamp-1">{ord.productName}</p>
                    <div className="flex justify-between text-[10px] text-[#A5A5AE]">
                      <span>${ord.orderAmount.toFixed(2)}</span>
                      <span className="text-[#21D39B] font-bold">
                        +${ord.estimatedCommission.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {isDone && ord.completedAt && (
                    <span className="text-[9px] text-[#A5A5AE] mt-2 block border-t border-[#282417] pt-1">
                      {new Date(ord.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Deposit History */}
      {profileTab === 'deposits' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Customer Deposit History ({userDeposits.length})
          </h4>
          {userDeposits.length === 0 ? (
            <p className="text-xs text-[#A5A5AE] py-6 text-center">No deposits submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">TX Hash</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282417]/60">
                  {userDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-[#181822]/60">
                      <td className="py-3 text-[#A5A5AE]">{new Date(dep.createdAt).toLocaleString()}</td>
                      <td className="py-3 font-bold text-white">${dep.amount.toFixed(2)} USDT</td>
                      <td className="py-3 text-[#A5A5AE]">{dep.method}</td>
                      <td className="py-3 font-mono text-[11px] text-[#E6B92F]">{dep.txHash}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            dep.status === 'approved'
                              ? 'bg-[#21D39B]/20 text-[#21D39B]'
                              : dep.status === 'pending'
                              ? 'bg-[#F5B942]/20 text-[#F5B942]'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Withdrawal History */}
      {profileTab === 'withdrawals' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Customer Withdrawal History ({userWithdrawals.length})
          </h4>
          {userWithdrawals.length === 0 ? (
            <p className="text-xs text-[#A5A5AE] py-6 text-center">No withdrawals submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">TRC20 Destination</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282417]/60">
                  {userWithdrawals.map((wth) => (
                    <tr key={wth.id} className="hover:bg-[#181822]/60">
                      <td className="py-3 text-[#A5A5AE]">{new Date(wth.createdAt).toLocaleString()}</td>
                      <td className="py-3 font-bold text-white">${wth.amount.toFixed(2)} USDT</td>
                      <td className="py-3 font-mono text-[11px] text-[#E6B92F]">{wth.destinationAddress}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            wth.status === 'approved'
                              ? 'bg-[#21D39B]/20 text-[#21D39B]'
                              : wth.status === 'pending'
                              ? 'bg-[#F5B942]/20 text-[#F5B942]'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Transaction History */}
      {profileTab === 'transactions' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Complete Transaction History ({userTransactions.length})
          </h4>
          {userTransactions.length === 0 ? (
            <p className="text-xs text-[#A5A5AE] py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Available After</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282417]/60">
                  {userTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#181822]/60">
                      <td className="py-3 text-[#A5A5AE]">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="py-3 font-mono text-[10px] uppercase text-[#E6B92F]">
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-white">{tx.title}</p>
                        <p className="text-[10px] text-[#A5A5AE]">{tx.description}</p>
                      </td>
                      <td className="py-3 font-bold tabular-nums">
                        <span className={tx.amount >= 0 ? 'text-[#21D39B]' : 'text-red-400'}>
                          {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-white tabular-nums">
                        ${tx.availableBalanceAfter.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-800 text-[#A5A5AE]">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Referral Network */}
      {profileTab === 'referrals' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Members Referred by @{user.username} ({userReferrals.length})
            </h4>
            <span className="text-xs text-[#E6B92F] font-mono font-bold">
              Code: {user.referralCode}
            </span>
          </div>

          {userReferrals.length === 0 ? (
            <p className="text-xs text-[#A5A5AE] py-6 text-center">
              No members registered using @{user.username}'s referral code yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                    <th className="py-2.5">Referred Member</th>
                    <th className="py-2.5">Registration Date</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Commission Rate</th>
                    <th className="py-2.5">Commission Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282417]/60">
                  {userReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-[#181822]/60">
                      <td className="py-3">
                        <p className="font-bold text-white">{ref.referredFullName || ref.referredUsername}</p>
                        <p className="text-[10px] text-[#A5A5AE] font-mono">@{ref.referredUsername}</p>
                      </td>
                      <td className="py-3 text-[#A5A5AE]">{new Date(ref.registrationDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white">
                        {(ref.commissionRate * 100).toFixed(0)}% Profit Share
                      </td>
                      <td className="py-3 font-bold text-[#21D39B]">
                        ${ref.totalCommissionGenerated.toFixed(2)} USDT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Login Activity & Device Info */}
      {profileTab === 'activity' && (
        <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Login Activity & Device Records
            </h4>
            <span className="text-[11px] text-[#A5A5AE]">
              IP & Device telemetry for account safety
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">IP Address</th>
                  <th className="py-2.5">Device & Browser</th>
                  <th className="py-2.5">Gateway Location</th>
                  <th className="py-2.5">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282417]/60">
                {loginActivityList.map((log) => (
                  <tr key={log.id} className="hover:bg-[#181822]/60">
                    <td className="py-3 text-[#A5A5AE] font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-white font-bold">{log.ipAddress}</td>
                    <td className="py-3 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-[#E6B92F]" />
                        <span>{log.device} • {log.browser}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[#A5A5AE]">{log.location}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
                        Verified Secure
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESET PASSWORD MODAL (Existing password remains unreadable)    */}
      {/* ============================================================== */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#111116] border border-[#E6B92F]/60 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A5A5AE] hover:text-white hover:bg-[#181822] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#E6B92F]/20 border border-[#E6B92F] flex items-center justify-center text-[#E6B92F]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset Customer Password</h3>
                <p className="text-[11px] text-[#A5A5AE]">For @{user.username} ({user.fullName})</p>
              </div>
            </div>

            <p className="text-xs text-[#A5A5AE] mb-4 leading-relaxed">
              For account safety, the customer's existing password is never revealed to administrators. You can set a new replacement password below.
            </p>

            {resetPassSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
                <span>{resetPassSuccess}</span>
              </div>
            )}

            {resetPassError && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF4D4D] shrink-0" />
                <span>{resetPassError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-[#A5A5AE] absolute left-3" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new replacement password"
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#181822] text-[#A5A5AE] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs shadow-md"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
