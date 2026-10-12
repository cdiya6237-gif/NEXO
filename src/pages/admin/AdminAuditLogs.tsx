import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Sliders,
  UserX,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { AuditLog, User as UserModel } from '../../types';
import { store } from '../../services/store';

interface AdminAuditLogsProps {
  currentAdmin: UserModel;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ currentAdmin }) => {
  const [logs, setLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refreshLogs = () => {
    setLogs(store.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
    const handleStorage = () => refreshLogs();
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, []);

  // Filter & Search
  const filteredLogs = logs
    .filter((log) => {
      // Action filter
      if (actionFilter !== 'ALL') {
        if (actionFilter === 'ADJUSTMENT' && !log.action.includes('ADJUSTMENT')) return false;
        if (actionFilter === 'USER_STATUS' && !log.action.includes('STATUS') && !log.action.includes('SUSPEND')) return false;
        if (actionFilter === 'LOGIN' && !log.action.includes('LOGIN') && !log.action.includes('LOGOUT') && !log.action.includes('SESSION')) return false;
        if (actionFilter === 'PASSWORD' && !log.action.includes('PASSWORD')) return false;
        if (actionFilter === 'WITHDRAWAL' && !log.action.includes('WITHDRAWAL')) return false;
        if (actionFilter === 'DEPOSIT' && !log.action.includes('DEPOSIT')) return false;
        if (actionFilter === 'ORDER' && !log.action.includes('ORDER')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          log.adminName.toLowerCase().includes(query) ||
          log.target.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" />
          Customer Login
        </span>
      );
    }
    if (action.includes('LOGOUT') || action.includes('TERMINATE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-300 border border-zinc-600/30 text-[10px] font-bold uppercase tracking-wider">
          <UserX className="w-3 h-3" />
          Customer Logout / End Session
        </span>
      );
    }
    if (action.includes('SIGNUP') || action.includes('REGISTER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
          <User className="w-3 h-3" />
          Customer Signup
        </span>
      );
    }
    if (action.includes('ADJUSTMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#E6B92F] border border-[#E6B92F]/30 text-[10px] font-bold uppercase tracking-wider">
          <Sliders className="w-3 h-3" />
          Wallet Adjustment
        </span>
      );
    }
    if (action.includes('STATUS') || action.includes('SUSPEND')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
          <UserX className="w-3 h-3" />
          User Status / Suspension
        </span>
      );
    }
    if (action.includes('PASSWORD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
          <KeyRound className="w-3 h-3" />
          Password Reset
        </span>
      );
    }
    if (action.includes('APPROVE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (action.includes('REJECT') || action.includes('DECLINE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
          <XCircle className="w-3 h-3" />
          Declined / Rejected
        </span>
      );
    }
    if (action.includes('ORDER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
          <RotateCcw className="w-3 h-3" />
          Order Action
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-300 border border-zinc-500/30 text-[10px] font-bold uppercase tracking-wider">
        <ShieldCheck className="w-3 h-3" />
        {action}
      </span>
    );
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Admin Name', 'Action', 'Target', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.adminName}"`,
      `"${l.action}"`,
      `"${l.target}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexo-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-[#111116] border border-[#282417] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#E6B92F] animate-pulse" />
            <span className="text-xs font-bold text-[#E6B92F] uppercase tracking-wider">
              Governance & Security
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Administrator Audit Logs
          </h2>
          <p className="text-xs text-[#A5A5AE] mt-1 max-w-xl">
            Immutable tracking of critical administrative actions including wallet adjustments, user suspensions, password resets, and transaction approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#E6B92F] border border-[#E6B92F]/40 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111116] border border-[#282417] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5AE]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin, customer, or action..."
            className="w-full bg-[#181822] border border-[#282417] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#A5A5AE] focus:outline-none focus:border-[#E6B92F]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#181822] border border-[#282417] rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#E6B92F]" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#181822] text-white">All Actions</option>
              <option value="LOGIN" className="bg-[#181822] text-white">Customer Logins & Sessions</option>
              <option value="ADJUSTMENT" className="bg-[#181822] text-white">Wallet Adjustments</option>
              <option value="USER_STATUS" className="bg-[#181822] text-white">User Suspensions</option>
              <option value="PASSWORD" className="bg-[#181822] text-white">Password Resets</option>
              <option value="WITHDRAWAL" className="bg-[#181822] text-white">Withdrawals</option>
              <option value="DEPOSIT" className="bg-[#181822] text-white">Deposits</option>
              <option value="ORDER" className="bg-[#181822] text-white">Orders</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#20202d] text-zinc-300 border border-[#282417] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#E6B92F]" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#111116] border border-[#282417] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#282417] bg-[#14141c] text-[11px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Username</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Customer / ID</th>
                <th className="py-3 px-4">Details & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282417]/50 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A5A5AE]">
                    <ShieldCheck className="w-10 h-10 text-[#282417] mx-auto mb-2" />
                    <span>No audit log records found matching your filters.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#161622] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-[#A5A5AE]" />
                        <span className="font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-[#A5A5AE] font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#E6B92F]/20 text-[#E6B92F] flex items-center justify-center font-bold text-[10px] border border-[#E6B92F]/30">
                          {log.adminName.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">
                          {log.adminName}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-zinc-200 bg-[#181822] px-2 py-0.5 rounded border border-[#282417]">
                        {log.target}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 text-zinc-300 max-w-md">
                      <p className="line-clamp-2 text-xs leading-relaxed">
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
