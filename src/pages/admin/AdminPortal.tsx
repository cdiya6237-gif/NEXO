import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  FileSpreadsheet,
  Share2,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Edit,
  Send,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  User as UserIcon,
  ChevronRight,
  ExternalLink,
  X,
  ArrowRight,
  Radio,
} from 'lucide-react';
import {
  User,
  DepositRequest,
  WithdrawalRequest,
  Transaction,
  Product,
  PromotionalBanner,
  ChatConversation,
  ChatMessage,
  AuditLog,
  ReferralRecord,
  CustomerSession,
} from '../../types';
import { store } from '../../services/store';

import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminCustomerProfile } from './AdminCustomerProfile';
import { AdminProductsManager } from './AdminProductsManager';
import { AdminBannersManager } from './AdminBannersManager';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminSettings } from './AdminSettings';

interface AdminPortalProps {
  currentAdmin: User;
  onExitAdmin: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  onExitAdmin,
}) => {
  // Active vertical sidebar tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Customer selected for Profile View & Wallet Adjust
  const [selectedCustomerForProfile, setSelectedCustomerForProfile] = useState<User | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Live Data State
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [activeSessions, setActiveSessions] = useState<CustomerSession[]>(store.getActiveSessions());
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'online' | 'offline' | 'suspended'>('all');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(25);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

  // Chat Selected
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [convMessages, setConvMessages] = useState<ChatMessage[]>([]);

  // Incoming Customer Message Notification
  const [incomingCustomerNotification, setIncomingCustomerNotification] = useState<{
    conversation: ChatConversation;
    message: ChatMessage;
    customerUser?: User;
  } | null>(null);
  const lastAdminSeenMsgIdRef = useRef<string | null>(null);

  // Monitor incoming customer messages across all conversations in real time
  useEffect(() => {
    // initialize latest customer message
    const allConvs = store.getConversations();
    let maxTime = 0;
    let latestId: string | null = null;
    allConvs.forEach((c) => {
      const msgs = store.getMessages(c.id);
      const custMsgs = msgs.filter((m) => m.senderRole === 'customer');
      const last = custMsgs.slice(-1)[0];
      if (last) {
        const t = new Date(last.timestamp).getTime();
        if (t > maxTime) {
          maxTime = t;
          latestId = last.id;
        }
      }
    });
    if (latestId) {
      lastAdminSeenMsgIdRef.current = latestId;
    }

    const checkIncomingCustomerMessages = () => {
      const convsList = store.getConversations();
      let latestCustMsg: ChatMessage | null = null;
      let targetConv: ChatConversation | null = null;

      for (const c of convsList) {
        const msgs = store.getMessages(c.id);
        const custMsgs = msgs.filter((m) => m.senderRole === 'customer');
        const last = custMsgs.slice(-1)[0];
        if (last) {
          const t = new Date(last.timestamp).getTime();
          if (!latestCustMsg || t > new Date(latestCustMsg.timestamp).getTime()) {
            latestCustMsg = last;
            targetConv = c;
          }
        }
      }

      if (latestCustMsg && targetConv) {
        const msgId: string = (latestCustMsg as ChatMessage).id;
        if (msgId !== lastAdminSeenMsgIdRef.current) {
          lastAdminSeenMsgIdRef.current = msgId;
          // If admin is not currently looking at this conversation on the chat tab, notify!
          if (activeTab !== 'chat' || selectedConv?.id !== targetConv.id) {
            const allUsers = store.getUsers();
            const matchedUser = allUsers.find(
              (u) => u.id === targetConv!.userId || u.email === targetConv!.customerEmail
            );
            setIncomingCustomerNotification({
              conversation: targetConv,
              message: latestCustMsg,
              customerUser: matchedUser,
            });
          }
        }
      }
    };

    window.addEventListener('nexo_storage_change', checkIncomingCustomerMessages);
    const interval = setInterval(checkIncomingCustomerMessages, 2000);

    return () => {
      window.removeEventListener('nexo_storage_change', checkIncomingCustomerMessages);
      clearInterval(interval);
    };
  }, [activeTab, selectedConv?.id]);

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (incomingCustomerNotification) {
      const timer = setTimeout(() => {
        setIncomingCustomerNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [incomingCustomerNotification]);

  const lastDataSnapshotRef = useRef<string>('');

  const reloadData = async () => {
    // Fetch live authoritative customer data directly from centralized backend
    const liveServerData = await store.fetchAdminLiveData();
    const freshUsers = liveServerData?.users || store.getUsers();
    const freshSessions = liveServerData?.sessions || store.getActiveSessions();
    const freshDeposits = store.getDeposits();
    const freshWithdrawals = store.getWithdrawals();
    const freshBanners = store.getBanners();
    const freshConvs = store.getConversations();
    const freshTx = store.getTransactions();
    const freshLogs = store.getAuditLogs();
    const freshRefs = store.getReferrals();

    // Fingerprint check: only update React state when underlying data has actually changed
    const snapshot = JSON.stringify({
      u: freshUsers.map((u) => `${u.id}:${u.isOnline}:${u.tier}:${u.status}:${u.lastLoginAt}`),
      s: freshSessions.map((s) => `${s.id}:${s.userId}:${s.isOnline}:${s.lastPingAt}`),
      d: freshDeposits.map((d) => `${d.id}:${d.status}:${d.amount}`),
      w: freshWithdrawals.map((w) => `${w.id}:${w.status}:${w.amount}`),
      c: freshConvs.map((c) => `${c.id}:${c.unreadAdminCount}:${c.lastMessageTimestamp}`),
      tx: freshTx.length,
      logs: freshLogs.length,
    });

    if (lastDataSnapshotRef.current === snapshot) {
      // Data is identical: skip all state updates to prevent visible re-renders or UI jumping
      return;
    }
    lastDataSnapshotRef.current = snapshot;

    setUsers(freshUsers);
    setActiveSessions(freshSessions);
    setDeposits(freshDeposits);
    setWithdrawals(freshWithdrawals);
    setBanners(freshBanners);
    setConversations(freshConvs);
    setTransactions(freshTx);
    setAuditLogs(freshLogs);
    setReferrals(freshRefs);

    // Update selected customer if one is currently open
    if (selectedCustomerForProfile) {
      const match = freshUsers.find((u) => u.id === selectedCustomerForProfile.id);
      if (match) {
        setSelectedCustomerForProfile((prev) => {
          if (!prev) return match;
          if (
            prev.id === match.id &&
            prev.tier === match.tier &&
            prev.status === match.status &&
            prev.isOnline === match.isOnline &&
            prev.lastLoginAt === match.lastLoginAt
          ) {
            return prev;
          }
          return match;
        });
      }
    }

    if (selectedConv) {
      setConvMessages(store.getMessages(selectedConv.id));
    }
  };

  const handleQuickTierChange = async (userId: string, newTier: 'SILVER' | 'GOLD', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await store.updateUserTier(userId, newTier, currentAdmin.fullName || currentAdmin.username);
    reloadData();
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('nexo_storage_change', handleStorage);
    window.addEventListener('storage', handleStorage);

    // Continuous polling: pull fresh data from centralized server so new customer logins and registrations appear live
    const pollInterval = setInterval(() => {
      store.syncFromServer();
      reloadData();
    }, 2500);

    return () => {
      window.removeEventListener('nexo_storage_change', handleStorage);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [selectedConv?.id]);

  // Actions
  const handleApproveDeposit = (id: string) => {
    store.approveDeposit(id, currentAdmin.fullName || currentAdmin.username);
    reloadData();
  };

  const handleRejectDeposit = (id: string) => {
    const reason = prompt('Reason for deposit rejection:', 'Invalid transaction hash / unverified receipt');
    if (reason) {
      store.rejectDeposit(id, reason, currentAdmin.fullName || currentAdmin.username);
      reloadData();
    }
  };

  const handleApproveWithdrawal = (id: string) => {
    store.approveWithdrawal(id, currentAdmin.fullName || currentAdmin.username);
    reloadData();
  };

  const handleRejectWithdrawal = (id: string) => {
    const reason = prompt('Reason for withdrawal rejection:', 'Compliance review requirement');
    if (reason) {
      store.rejectWithdrawal(id, reason, currentAdmin.fullName || currentAdmin.username);
      reloadData();
    }
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !chatReplyText.trim()) return;

    store.addMessage({
      conversationId: selectedConv.id,
      senderId: currentAdmin.id,
      senderName: 'NEXO Executive Support',
      senderRole: 'support',
      message: chatReplyText.trim(),
    });

    setChatReplyText('');
    setConvMessages(store.getMessages(selectedConv.id));
    reloadData();
  };

  // Metrics
  const customerUsers = users.filter((u) => u.role !== 'super_admin');
  const onlineCustomers = customerUsers.filter(
    (u) => u.isOnline || activeSessions.some((s) => s.userId === u.id && s.isOnline)
  );
  const offlineCustomers = customerUsers.filter(
    (u) => !onlineCustomers.some((o) => o.id === u.id)
  );
  const suspendedCustomers = customerUsers.filter((u) => u.status === 'suspended');

  const filteredCustomers = customerUsers.filter((u) => {
    const isOnline = u.isOnline || activeSessions.some((s) => s.userId === u.id && s.isOnline);
    if (customerStatusFilter === 'online' && !isOnline) return false;
    if (customerStatusFilter === 'offline' && isOnline) return false;
    if (customerStatusFilter === 'suspended' && u.status !== 'suspended') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize));
  const safeCustomerPage = Math.min(customerPage, totalCustomerPages);
  const paginatedCustomers = filteredCustomers.slice(
    (safeCustomerPage - 1) * customerPageSize,
    safeCustomerPage * customerPageSize
  );

  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const totalHold = customerUsers.reduce((acc, u) => acc + store.getWalletBalances(u.id).hold, 0);
  const totalAvailable = customerUsers.reduce((acc, u) => acc + store.getWalletBalances(u.id).available, 0);
  const totalApprovedDeposits = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedWithdrawals = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  // Tab switch handler: resets customer profile if switching to non-customer tab
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab !== 'customers' && tab !== 'adjustments') {
      setSelectedCustomerForProfile(null);
    }
    if (tab === 'chat' && conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
      setConvMessages(store.getMessages(conversations[0].id));
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#070709] text-white">
      {/* ============================================================== */}
      {/* 1. LEFT VERTICAL SIDEBAR (Consistent across entire Admin Panel) */}
      {/* ============================================================== */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentAdmin={currentAdmin}
        onExitAdmin={onExitAdmin}
        pendingDepositsCount={pendingDepositsCount}
        pendingWithdrawalsCount={pendingWithdrawalsCount}
      />

      {/* ============================================================== */}
      {/* 2. RIGHT MAIN CONTENT AREA                                     */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070709] relative">
        {/* Real-Time Incoming Customer Message Notification Banner */}
        {incomingCustomerNotification && (
          <div className="fixed top-4 right-4 md:right-8 z-50 w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
            <div
              onClick={() => {
                setActiveTab('chat');
                setSelectedConv(incomingCustomerNotification.conversation);
                setConvMessages(store.getMessages(incomingCustomerNotification.conversation.id));
                setIncomingCustomerNotification(null);
              }}
              className="bg-[#14141c]/95 border-2 border-[#E6B92F] backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_rgba(230,185,47,0.35)] flex items-start gap-3.5 cursor-pointer hover:bg-[#181824] transition-all group"
            >
              {/* Customer Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E6B92F] text-black font-extrabold flex items-center justify-center shrink-0 border border-[#E6B92F]/60">
                {incomingCustomerNotification.customerUser?.avatarUrl ? (
                  <img
                    src={incomingCustomerNotification.customerUser.avatarUrl}
                    alt={incomingCustomerNotification.conversation.customerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>
                    {incomingCustomerNotification.conversation.customerName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>New Message from {incomingCustomerNotification.conversation.customerName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#21D39B] animate-pulse" />
                  </span>
                  <span className="text-[10px] text-[#A5A5AE] font-mono shrink-0">
                    Just now
                  </span>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  “{incomingCustomerNotification.message.message}”
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#E6B92F] group-hover:translate-x-1 transition-transform">
                  <span>[Open Conversation & Reply]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIncomingCustomerNotification(null);
                }}
                className="text-[#A5A5AE] hover:text-white p-1 rounded-lg hover:bg-[#1f1f2c] transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#0c0c10]/95 backdrop-blur-md border-b border-[#282417] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black text-white tracking-wider uppercase">
              {activeTab === 'overview' && 'System Overview Dashboard'}
              {activeTab === 'customers' && (selectedCustomerForProfile ? 'Customer Profile & Wallet' : 'Customer Directory')}
              {activeTab === 'deposits' && 'Deposit Processing Desk'}
              {activeTab === 'withdrawals' && 'Withdrawal Settlement Desk'}
              {activeTab === 'adjustments' && 'Wallet Adjustment Console'}
              {activeTab === 'ledger' && 'Global Transaction Ledger'}
              {activeTab === 'products' && 'Products & Tier Privileges'}
              {activeTab === 'referrals' && 'Affiliate Referral Network'}
              {activeTab === 'banners' && 'Promotional Showcase Banners'}
              {activeTab === 'chat' && '24/7 Member Support Chat'}
              {activeTab === 'settings' && 'System Settings & ZIP Export'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#A5A5AE]">
              <span className="w-2 h-2 rounded-full bg-[#21D39B] animate-pulse" />
              <span>NEXO Live Engine</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#E6B92F] px-2.5 py-1 rounded-xl bg-[#14141c] border border-[#282417]">
              Super Admin
            </span>
          </div>
        </header>

        {/* Dynamic Screen View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD (OVERVIEW)                                    */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A5A5AE] font-semibold">Total Members</span>
                    <Users className="w-4 h-4 text-[#E6B92F]" />
                  </div>
                  <span className="text-2xl font-black text-white block mt-2">{customerUsers.length}</span>
                  <span className="text-[10px] text-[#21D39B] font-bold block mt-1">Registered customers</span>
                </div>

                <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A5A5AE] font-semibold">Live Online</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-white">{onlineCustomers.length}</span>
                    <span className="text-xs text-emerald-400 font-bold">Logged In Now</span>
                  </div>
                  <span className="text-[10px] text-[#A5A5AE] block mt-1">
                    {onlineCustomers.length > 0
                      ? `${onlineCustomers.map((c) => c.fullName).join(', ')} active`
                      : 'No active customer sessions'}
                  </span>
                </div>

                <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A5A5AE] font-semibold">Customer Balances</span>
                    <DollarSign className="w-4 h-4 text-[#21D39B]" />
                  </div>
                  <span className="text-2xl font-black text-white block mt-2 tabular-nums">
                    ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#A5A5AE] block mt-1">Available across accounts</span>
                </div>

                <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A5A5AE] font-semibold">Total Deposits Approved</span>
                    <ArrowDownLeft className="w-4 h-4 text-[#21D39B]" />
                  </div>
                  <span className="text-2xl font-black text-white block mt-2 tabular-nums">
                    ${totalApprovedDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#A5A5AE] block mt-1">{deposits.length} deposit requests</span>
                </div>

                <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A5A5AE] font-semibold">Total Withdrawals Paid</span>
                    <ArrowUpRight className="w-4 h-4 text-[#FF4D4D]" />
                  </div>
                  <span className="text-2xl font-black text-white block mt-2 tabular-nums">
                    ${totalApprovedWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#A5A5AE] block mt-1">{withdrawals.length} withdrawal requests</span>
                </div>
              </div>

              {/* LIVE ACTIVE CUSTOMER SESSIONS PANEL */}
              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Live Active Customer Sessions</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
                          {onlineCustomers.length} Currently Logged In
                        </span>
                      </h3>
                      <p className="text-xs text-[#A5A5AE]">
                        Real-time synchronization with Customer Portal across all devices & browsers
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCustomerStatusFilter('online');
                      setActiveTab('customers');
                    }}
                    className="text-xs text-[#E6B92F] hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>View in Customer Directory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {onlineCustomers.length === 0 ? (
                  <div className="py-6 px-4 rounded-2xl bg-[#161620]/60 border border-[#282417] text-center">
                    <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto mb-2">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-300">No customers are currently logged in</p>
                    <p className="text-[11px] text-[#A5A5AE] mt-0.5">
                      When a customer logs into the Customer Portal, their active session will appear here live with instant synchronization.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {onlineCustomers.map((u) => {
                      const bal = store.getWalletBalances(u.id);
                      const sess = activeSessions.find((s) => s.userId === u.id);
                      return (
                        <div
                          key={u.id}
                          className="p-4 rounded-2xl bg-[#141d18] border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between gap-3 shadow-md relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-extrabold text-xs shrink-0">
                                {u.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-xs truncate">{u.fullName}</p>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                </div>
                                <p className="text-[10px] text-[#A5A5AE] font-mono truncate">@{u.username}</p>
                              </div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold uppercase shrink-0">
                              Logged In Now
                            </span>
                          </div>

                          <div className="text-[11px] bg-black/40 rounded-xl p-2.5 space-y-1 border border-emerald-500/20">
                            <div className="flex items-center justify-between text-[#A5A5AE]">
                              <span>Session Device:</span>
                              <span className="text-white font-mono text-[10px]">
                                {sess?.browser || 'Browser Session'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#A5A5AE]">
                              <span>Login Time:</span>
                              <span className="text-emerald-400 font-mono text-[10px]">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#A5A5AE]">
                              <span>Available USDT:</span>
                              <span className="text-white font-bold tabular-nums">
                                ${bal.available.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedCustomerForProfile(u);
                                setActiveTab('customers');
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-[#E6B92F] text-black font-bold text-xs hover:bg-[#f4d66d] transition-colors cursor-pointer text-center"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Disconnect active session for @${u.username}?`)) {
                                  store.terminateCustomerSession(u.id, currentAdmin.username);
                                  reloadData();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-bold text-xs transition-colors cursor-pointer"
                              title="Force End Session"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pending Action Alerts */}
              {(pendingDepositsCount > 0 || pendingWithdrawalsCount > 0) && (
                <div className="p-4 rounded-2xl bg-[#1c1708] border border-[#E6B92F] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#E6B92F] shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Pending Requests Require Review</h4>
                      <p className="text-[11px] text-[#A5A5AE]">
                        {pendingDepositsCount} deposits and {pendingWithdrawalsCount} withdrawals waiting for finance approval.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {pendingDepositsCount > 0 && (
                      <button
                        onClick={() => setActiveTab('deposits')}
                        className="px-3 py-1.5 rounded-xl bg-[#E6B92F] text-black font-bold text-xs cursor-pointer"
                      >
                        Review Deposits ({pendingDepositsCount})
                      </button>
                    )}
                    {pendingWithdrawalsCount > 0 && (
                      <button
                        onClick={() => setActiveTab('withdrawals')}
                        className="px-3 py-1.5 rounded-xl bg-[#181822] text-[#E6B92F] border border-[#E6B92F]/40 font-bold text-xs cursor-pointer"
                      >
                        Review Withdrawals ({pendingWithdrawalsCount})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Customer Roster */}
              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Recent Customer Registrations</h3>
                    <p className="text-xs text-[#A5A5AE]">Quick access to manage customer profiles & balances</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-xs text-[#E6B92F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Customers ({users.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#A5A5AE]">
                    No registered customers yet. New signups will appear here automatically.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {users.slice(0, 6).map((u) => {
                      const bal = store.getWalletBalances(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedCustomerForProfile(u);
                            setActiveTab('customers');
                          }}
                          className="p-4 rounded-2xl bg-[#161620] border border-[#282417] hover:border-[#E6B92F]/60 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#181822] border border-[#282417] flex items-center justify-center text-white font-extrabold text-xs shrink-0 group-hover:border-[#E6B92F]/50">
                              {u.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate group-hover:text-[#E6B92F]">
                                {u.fullName}
                              </p>
                              <p className="text-[10px] text-[#A5A5AE] font-mono truncate">@{u.username}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-white tabular-nums block">
                              ${bal.available.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-[#21D39B] font-bold uppercase">{u.tier}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CUSTOMERS (DIRECTORY & COMPLETE PROFILE)                */}
          {/* ============================================================== */}
          {activeTab === 'customers' && (
            <div>
              {selectedCustomerForProfile ? (
                <AdminCustomerProfile
                  user={selectedCustomerForProfile}
                  currentAdmin={currentAdmin}
                  onBack={() => setSelectedCustomerForProfile(null)}
                  onUserUpdated={reloadData}
                />
              ) : (
                <div className="space-y-5 max-w-7xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#E6B92F]" />
                        <span>Customer Management Directory</span>
                      </h2>
                      <p className="text-xs text-[#A5A5AE]">
                        Click any customer or click &quot;View Profile / Wallet Adjust&quot; to manage their account details, balances, and history.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#A5A5AE] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by name, @username, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#111116] border border-[#282417] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E6B92F] w-64"
                      />
                    </div>
                  </div>

                  {/* Status & Online Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setCustomerStatusFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        customerStatusFilter === 'all'
                          ? 'bg-[#E6B92F] text-black shadow-md'
                          : 'bg-[#161620] text-[#A5A5AE] hover:text-white border border-[#282417]'
                      }`}
                    >
                      All Customers ({customerUsers.length})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('online')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        customerStatusFilter === 'online'
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'bg-[#161620] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Logged In Now ({onlineCustomers.length})</span>
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('offline')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        customerStatusFilter === 'offline'
                          ? 'bg-zinc-700 text-white shadow-md'
                          : 'bg-[#161620] text-[#A5A5AE] hover:text-white border border-[#282417]'
                      }`}
                    >
                      Offline ({offlineCustomers.length})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('suspended')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        customerStatusFilter === 'suspended'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-[#161620] text-red-400 hover:text-red-300 border border-red-500/30'
                      }`}
                    >
                      Suspended ({suspendedCustomers.length})
                    </button>
                  </div>

                  <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl overflow-x-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#A5A5AE]">
                        {customerUsers.length === 0
                          ? 'No customer accounts found in the database.'
                          : 'No customers match your search or filter criteria.'}
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                            <th className="py-3 px-3">Customer</th>
                            <th className="py-3 px-3">Live Session / Online</th>
                            <th className="py-3 px-3">Contact</th>
                            <th className="py-3 px-3">Tier / VIP</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Available Balance</th>
                            <th className="py-3 px-3">Tasks</th>
                            <th className="py-3 px-3">Referral Code</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#282417]/50">
                          {paginatedCustomers.map((u) => {
                              const bal = store.getWalletBalances(u.id);
                              const prog = store.getUserCycleState(u.id);
                              const doneCount = prog.orders.filter((o) => o.status === 'completed').length;
                              const isOnline = u.isOnline || activeSessions.some((s) => s.userId === u.id && s.isOnline);
                              const sess = activeSessions.find((s) => s.userId === u.id);

                              return (
                                <tr
                                  key={u.id}
                                  className="hover:bg-[#181822]/60 transition-colors cursor-pointer group"
                                  onClick={() => setSelectedCustomerForProfile(u)}
                                >
                                  <td className="py-3.5 px-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-[#181822] border border-[#282417] flex items-center justify-center text-white font-extrabold text-xs shrink-0 group-hover:border-[#E6B92F]/50">
                                        {u.fullName.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-bold text-white group-hover:text-[#E6B92F] transition-colors">
                                          {u.fullName}
                                        </p>
                                        <p className="text-[10px] text-[#A5A5AE] font-mono">@{u.username}</p>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3">
                                    {isOnline ? (
                                      <div className="flex flex-col gap-0.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-extrabold text-[10px] w-fit">
                                          <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                          </span>
                                          Logged In Now
                                        </span>
                                        <span className="text-[9px] text-[#A5A5AE] font-mono">
                                          {sess?.browser || 'Browser Session'}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-0.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-[#A5A5AE] font-medium text-[10px] w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                          Offline
                                        </span>
                                        <span className="text-[9px] text-zinc-500">
                                          {u.lastLoginAt ? `Last: ${new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never logged in'}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-3 text-[#A5A5AE]">
                                    <p className="text-white text-[11px] truncate max-w-[140px]">{u.email}</p>
                                    <p className="text-[10px] font-mono">{u.phone}</p>
                                  </td>

                                  <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="inline-flex items-center bg-[#13131c] border border-[#282417] p-1 rounded-xl gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => handleQuickTierChange(u.id, 'SILVER', e)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                          u.tier === 'SILVER'
                                            ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-white/20'
                                            : 'text-[#A5A5AE] hover:text-white hover:bg-zinc-800/60'
                                        }`}
                                        title="Assign Silver Tier (VIP 1)"
                                      >
                                        🥈 Silver
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleQuickTierChange(u.id, 'GOLD', e)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                          u.tier === 'GOLD'
                                            ? 'bg-[#E6B92F] text-black font-extrabold shadow-sm'
                                            : 'text-[#E6B92F]/70 hover:text-[#E6B92F] hover:bg-[#E6B92F]/10'
                                        }`}
                                        title="Assign Gold Tier (VIP 3)"
                                      >
                                        🥇 Gold
                                      </button>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        u.status === 'active'
                                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-red-950/40 text-red-300 border border-red-500/40'
                                      }`}
                                    >
                                      {u.status}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 font-bold text-white text-sm tabular-nums">
                                    ${bal.available.toFixed(2)}
                                  </td>

                                  <td className="py-3.5 px-3 text-[11px]">
                                    <span className="font-bold text-[#E6B92F]">
                                      {doneCount} of 25
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 font-mono text-[11px] text-[#E6B92F]">
                                    {u.referralCode}
                                  </td>

                                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                      {isOnline && (
                                        <button
                                          onClick={() => {
                                            if (confirm(`Terminate live session for @${u.username}?`)) {
                                              store.terminateCustomerSession(u.id, currentAdmin.username);
                                              reloadData();
                                            }
                                          }}
                                          className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-bold text-[10px] transition-colors cursor-pointer"
                                          title="Disconnect session"
                                        >
                                          Disconnect
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setSelectedCustomerForProfile(u)}
                                        className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#E6B92F] hover:text-white border border-[#282417] hover:border-[#E6B92F]/50 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                        title="View Complete Customer Profile"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-[#E6B92F] inline-block animate-pulse" />
                                        <span>View Details</span>
                                      </button>
                                      <button
                                        onClick={() => setSelectedCustomerForProfile(u)}
                                        className="px-3 py-1.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-[11px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                                        title="Adjust Customer Wallet Balance"
                                      >
                                        <Sliders className="w-3 h-3" />
                                        <span>Adjust</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination & Counter Bar */}
                  {filteredCustomers.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-[#A5A5AE]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Showing <strong className="text-white">{(safeCustomerPage - 1) * customerPageSize + 1}</strong> to{' '}
                          <strong className="text-white">{Math.min(safeCustomerPage * customerPageSize, filteredCustomers.length)}</strong> of{' '}
                          <strong className="text-[#E6B92F]">{filteredCustomers.length}</strong> customers
                          {filteredCustomers.length !== customerUsers.length && ` (filtered from ${customerUsers.length} total)`}
                        </span>

                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[11px] text-zinc-400">Rows:</span>
                          <select
                            value={customerPageSize}
                            onChange={(e) => {
                              setCustomerPageSize(Number(e.target.value));
                              setCustomerPage(1);
                            }}
                            className="bg-[#161620] border border-[#282417] text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#E6B92F] cursor-pointer"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={1500}>1500 (All)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                          disabled={safeCustomerPage <= 1}
                          className="px-3 py-1.5 rounded-xl bg-[#161620] border border-[#282417] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20202d] transition-colors cursor-pointer font-bold text-xs"
                        >
                          Previous
                        </button>
                        <span className="px-2 font-mono text-zinc-400">
                          Page <strong className="text-white">{safeCustomerPage}</strong> of{' '}
                          <strong className="text-white">{totalCustomerPages}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
                          disabled={safeCustomerPage >= totalCustomerPages}
                          className="px-3 py-1.5 rounded-xl bg-[#161620] border border-[#282417] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20202d] transition-colors cursor-pointer font-bold text-xs"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: DEPOSITS REVIEW                                         */}
          {/* ============================================================== */}
          {activeTab === 'deposits' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-[#21D39B]" />
                    <span>Deposit Processing Desk ({deposits.length})</span>
                  </h2>
                  <p className="text-xs text-[#A5A5AE]">
                    Review manual TRC20 deposits and instant payment gateway proofs. Approving deposits immediately credits available balance.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setDepositFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                        depositFilter === st
                          ? 'bg-[#E6B92F] text-black'
                          : 'bg-[#181822] text-[#A5A5AE] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Transaction Hash</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282417]/50">
                    {deposits
                      .filter((d) => depositFilter === 'all' || d.status === depositFilter)
                      .map((dep) => (
                        <tr key={dep.id} className="hover:bg-[#181822]/60">
                          <td className="py-3 px-3 text-[#A5A5AE]">
                            {new Date(dep.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{dep.userFullName}</span>
                            <span className="text-[10px] text-[#A5A5AE] font-mono">@{dep.username}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#21D39B] text-sm tabular-nums">
                            ${dep.amount.toFixed(2)} USDT
                          </td>
                          <td className="py-3 px-3 text-[#A5A5AE]">{dep.method}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-zinc-300">
                            {dep.txHash}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                dep.status === 'approved'
                                  ? 'bg-[#21D39B]/20 text-[#21D39B] border border-[#21D39B]/40'
                                  : dep.status === 'pending'
                                  ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {dep.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {dep.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveDeposit(dep.id)}
                                  className="px-3 py-1 rounded-xl bg-[#21D39B] hover:bg-[#1bb383] text-black font-bold text-[10px] cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectDeposit(dep.id)}
                                  className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-[10px] border border-red-500/40 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#A5A5AE]">
                                Processed by {dep.processedBy || 'Admin'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: WITHDRAWALS REVIEW                                      */}
          {/* ============================================================== */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-[#FF4D4D]" />
                    <span>Withdrawal Settlement Desk ({withdrawals.length})</span>
                  </h2>
                  <p className="text-xs text-[#A5A5AE]">
                    Disburse verified customer withdrawal requests. System strictly enforces completion of all 25 orders before eligibility.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setWithdrawalFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                        withdrawalFilter === st
                          ? 'bg-[#E6B92F] text-black'
                          : 'bg-[#181822] text-[#A5A5AE] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Destination Address</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282417]/50">
                    {withdrawals
                      .filter((w) => withdrawalFilter === 'all' || w.status === withdrawalFilter)
                      .map((wth) => (
                        <tr key={wth.id} className="hover:bg-[#181822]/60">
                          <td className="py-3 px-3 text-[#A5A5AE]">
                            {new Date(wth.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{wth.userFullName}</span>
                            <span className="text-[10px] text-[#A5A5AE] font-mono">@{wth.username}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#FF4D4D] text-sm tabular-nums">
                            ${wth.amount.toFixed(2)} USDT
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#E6B92F]">
                            {wth.destinationAddress}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                wth.status === 'approved'
                                  ? 'bg-[#21D39B]/20 text-[#21D39B] border border-[#21D39B]/40'
                                  : wth.status === 'pending'
                                  ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {wth.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {wth.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveWithdrawal(wth.id)}
                                  className="px-3 py-1 rounded-xl bg-[#21D39B] hover:bg-[#1bb383] text-black font-bold text-[10px] cursor-pointer"
                                >
                                  Disburse
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(wth.id)}
                                  className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-[10px] border border-red-500/40 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#A5A5AE]">
                                Processed by {wth.processedBy || 'Admin'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: WALLET ADJUST (DIRECT ADJUSTMENT CONSOLE)                */}
          {/* ============================================================== */}
          {activeTab === 'adjustments' && (
            <div>
              {selectedCustomerForProfile ? (
                <AdminCustomerProfile
                  user={selectedCustomerForProfile}
                  currentAdmin={currentAdmin}
                  onBack={() => setSelectedCustomerForProfile(null)}
                  onUserUpdated={reloadData}
                />
              ) : (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#E6B92F]" />
                      <span>Wallet Adjustment Console</span>
                    </h2>
                    <p className="text-xs text-[#A5A5AE]">
                      Select any customer below to open their profile and perform an instant balance addition or deduction.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.map((u) => {
                      const bal = store.getWalletBalances(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedCustomerForProfile(u)}
                          className="bg-[#111116] border border-[#282417] hover:border-[#E6B92F] rounded-3xl p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6B92F]/20 text-[#E6B92F] font-bold">
                                {u.tier}
                              </span>
                              <span className="text-[10px] text-[#A5A5AE] font-mono">@{u.username}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm group-hover:text-[#E6B92F] transition-colors">
                              {u.fullName}
                            </h4>
                            <p className="text-xs text-[#A5A5AE] truncate">{u.email}</p>
                          </div>

                          <div className="pt-4 mt-3 border-t border-[#282417] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-[#A5A5AE] block">Current Balance</span>
                              <span className="text-base font-black text-white tabular-nums">
                                ${bal.available.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-xs text-[#E6B92F] font-bold group-hover:translate-x-1 transition-transform">
                              Adjust →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: GLOBAL TRANSACTION LEDGER                               */}
          {/* ============================================================== */}
          {activeTab === 'ledger' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#E6B92F]" />
                    <span>Global Transaction Ledger ({transactions.length})</span>
                  </h2>
                  <p className="text-xs text-[#A5A5AE]">
                    Permanent audit history across all customer accounts and administrative interventions.
                  </p>
                </div>
                <span className="text-xs text-[#21D39B] font-mono font-bold">
                  Double-Entry Ledger Verified
                </span>
              </div>

              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl overflow-x-auto max-h-[700px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161620] text-[#A5A5AE] border-b border-[#282417] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Transaction Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Available After</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282417]/50">
                    {transactions.map((tx) => {
                      const u = users.find((usr) => usr.id === tx.userId);
                      const isPos = tx.amount >= 0;
                      return (
                        <tr key={tx.id} className="hover:bg-[#181822]/60">
                          <td className="py-3 px-3 text-[#A5A5AE]">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-semibold text-white">
                            {u ? `@${u.username}` : tx.userId}
                          </td>
                          <td className="py-3 px-3">
                            <span className="uppercase text-[10px] font-bold text-[#E6B92F]">
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-300 max-w-xs truncate">{tx.title}</td>
                          <td className={`py-3 px-3 font-bold tabular-nums ${isPos ? 'text-[#21D39B]' : 'text-[#FF4D4D]'}`}>
                            {isPos ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono text-white tabular-nums">
                            ${(tx.balanceAfter ?? tx.availableBalanceAfter).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-[#21D39B] font-bold uppercase">{tx.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: PRODUCTS (2 MAIN TYPES + 25 PIPELINE ITEMS)             */}
          {/* ============================================================== */}
          {activeTab === 'products' && (
            <AdminProductsManager
              currentAdmin={currentAdmin}
              onProductsChanged={reloadData}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 8: REFERRALS MONITORING                                    */}
          {/* ============================================================== */}
          {activeTab === 'referrals' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#E6B92F]" />
                  <span>Referral Network & 10% Profit Sharing ({referrals.length})</span>
                </h2>
                <p className="text-xs text-[#A5A5AE]">
                  Tracks who referred whom, registered sponsor codes, and cumulative 10% referral commission payouts.
                </p>
              </div>

              <div className="bg-[#111116] border border-[#282417] rounded-3xl p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#282417] text-[#A5A5AE] text-[10px] uppercase">
                      <th className="py-2.5 px-3">Sponsor / Referrer</th>
                      <th className="py-2.5 px-3">Referred Member</th>
                      <th className="py-2.5 px-3">Registration Date</th>
                      <th className="py-2.5 px-3">Code Used</th>
                      <th className="py-2.5 px-3">Commission Rate</th>
                      <th className="py-2.5 px-3">Total Commission Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282417]/50">
                    {referrals.map((r) => (
                      <tr key={r.id} className="hover:bg-[#181822]/60">
                        <td className="py-3 px-3 font-bold text-[#E6B92F]">@{r.referrerUsername}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{r.referredFullName}</span>
                          <span className="text-[10px] text-[#A5A5AE] font-mono">@{r.referredUsername}</span>
                        </td>
                        <td className="py-3 px-3 text-[#A5A5AE]">{new Date(r.registrationDate).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-mono text-[#E6B92F]">{r.referralCodeUsed}</td>
                        <td className="py-3 px-3 font-bold text-white">{(r.commissionRate * 100).toFixed(0)}% Profit Share</td>
                        <td className="py-3 px-3 font-bold text-[#21D39B] tabular-nums">
                          ${r.totalCommissionGenerated.toFixed(2)} USDT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: PROMOTIONAL BANNERS                                     */}
          {/* ============================================================== */}
          {activeTab === 'banners' && (
            <AdminBannersManager
              currentAdmin={currentAdmin}
              onBannersChanged={reloadData}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 10: 24/7 SUPPORT CHAT                                      */}
          {/* ============================================================== */}
          {activeTab === 'chat' && (
            <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px] max-w-7xl mx-auto">
              <div className="space-y-3 border-r border-[#282417] pr-4 overflow-y-auto">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Customer Conversations ({conversations.length})
                </h4>

                {conversations.map((c) => {
                  const isSel = selectedConv?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedConv(c);
                        setConvMessages(store.getMessages(c.id));
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-[#181822] border-[#E6B92F] text-white'
                          : 'bg-[#14141a] border-[#282417] text-[#A5A5AE] hover:bg-[#181822]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-white">{c.customerName}</span>
                        <span className="text-[9px] text-[#21D39B]">Active</span>
                      </div>
                      <span className="text-[10px] text-[#A5A5AE] block truncate mt-0.5">{c.lastMessage}</span>
                    </div>
                  );
                })}
              </div>

              <div className="md:col-span-2 flex flex-col justify-between h-full pl-2">
                {selectedConv ? (
                  <>
                    <div className="border-b border-[#282417] pb-3 mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{selectedConv.customerName}</span>
                          <span className="w-2 h-2 rounded-full bg-[#21D39B] animate-pulse" />
                        </h4>
                        <span className="text-[10px] text-[#A5A5AE]">
                          {selectedConv.customerEmail} • {selectedConv.customerPhone}
                        </span>
                      </div>

                      {(() => {
                        const matchedCustomer = users.find(
                          (u) => u.id === selectedConv.userId || u.email === selectedConv.customerEmail
                        );
                        return matchedCustomer ? (
                          <button
                            onClick={() => setSelectedCustomerForProfile(matchedCustomer)}
                            className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#222232] text-[#E6B92F] border border-[#E6B92F]/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>View Customer Profile</span>
                          </button>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {convMessages.map((m) => {
                        const isAdmin = m.senderRole === 'support' || m.senderRole === 'admin';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                isAdmin
                                  ? 'bg-[#E6B92F] text-black font-semibold'
                                  : 'bg-[#181822] text-zinc-200 border border-[#282417]'
                              }`}
                            >
                              {m.message}
                            </div>
                            <span className="text-[9px] text-[#A5A5AE] mt-0.5 px-1">
                              {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendAdminReply} className="flex gap-2 pt-3 border-t border-[#282417]">
                      <input
                        type="text"
                        value={chatReplyText}
                        onChange={(e) => setChatReplyText(e.target.value)}
                        placeholder="Type response to customer..."
                        className="flex-1 bg-[#181822] border border-[#282417] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E6B92F]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-[#A5A5AE]">
                    Select a customer conversation on the left to respond.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: AUDIT LOGS (ADMINISTRATOR ACTIONS & GOVERNANCE)         */}
          {/* ============================================================== */}
          {activeTab === 'audit-logs' && <AdminAuditLogs currentAdmin={currentAdmin} />}

          {/* ============================================================== */}
          {/* TAB 12: SETTINGS & COMPLETE PROJECT ZIP DOWNLOAD               */}
          {/* ============================================================== */}
          {activeTab === 'settings' && <AdminSettings currentAdmin={currentAdmin} />}
        </main>
      </div>
    </div>
  );
};
