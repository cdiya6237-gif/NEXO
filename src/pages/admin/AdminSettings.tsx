import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  Download,
  FolderArchive,
  FileArchive,
  Save,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Lock,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { User } from '../../types';
import { store, getApiUrl, safeFetchJson } from '../../services/store';
import { RefreshCw, Activity } from 'lucide-react';

interface AdminSettingsProps {
  currentAdmin: User;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ currentAdmin }) => {
  const [platformAddress, setPlatformAddress] = useState(store.getPlatformTRC20Address());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [apiEndpoint, setApiEndpoint] = useState(
    localStorage.getItem('nexo_api_endpoint') || ''
  );
  const [apiSaved, setApiSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [forceSyncing, setForceSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSaveApiEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiEndpoint.trim()) {
      localStorage.setItem('nexo_api_endpoint', apiEndpoint.trim());
    } else {
      localStorage.removeItem('nexo_api_endpoint');
    }
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await safeFetchJson<any>(getApiUrl('/api/health'));
      if (res.ok && res.data) {
        const data = res.data;
        const storageInfo = data.storageEngine || 'Persistent Storage Active';
        setConnectionStatus(`Connected! Storage: ${storageInfo} | Users: ${data.userCount} | Sessions: ${data.activeSessionsCount}`);
      } else {
        setConnectionStatus(`Server responded with status ${res.status || 'offline'}: ${res.error || 'Connection Failed'}`);
      }
    } catch (err: any) {
      setConnectionStatus(`Connection failed: ${err?.message || 'Network Error'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleForceSync = async () => {
    setForceSyncing(true);
    setSyncStatus(null);
    try {
      await store.syncFromServer();
      setSyncStatus(`Synchronized! ${store.getUsers().length} users loaded from server.`);
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err?.message || 'Failed'}`);
    } finally {
      setForceSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    store.setPlatformTRC20Address(platformAddress);
    store.addAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName || currentAdmin.username,
      action: 'UPDATE_PLATFORM_TRC20',
      target: 'SYSTEM',
      details: `TRC20 Deposit address set to ${platformAddress}`,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(platformAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ZIP Download Handler
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    setDownloadSuccess(false);

    try {
      const token = store.getAdminToken() || '';
      const url = `/api/admin/download-project-zip${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      // Fetch binary blob from server
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Trigger download via anchor
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'NEXO-Complete-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up memory
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      alert('Failed to download project ZIP: ' + (err?.message || 'Server error'));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#E6B92F]" />
          <span>System Settings & Deployment</span>
        </h2>
        <p className="text-xs text-[#A5A5AE]">
          Configure global platform parameters, financial settlement addresses, and export the complete project package.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Settings & Financial Configurations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TRC20 Wallet Address Configuration */}
          <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#282417]">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#E6B92F]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Platform TRC20 Deposit Wallet
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6B92F]/20 text-[#E6B92F] font-bold">
                USDT TRON NETWORK
              </span>
            </div>

            <p className="text-xs text-[#A5A5AE] leading-relaxed">
              This USDT TRC20 address is displayed to customers on the Deposit page. Customer transfers will be directed to this address.
            </p>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
                <span>Platform TRC20 address updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">
                  Destination Wallet Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={platformAddress}
                    onChange={(e) => setPlatformAddress(e.target.value.trim())}
                    className="flex-1 bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-2 bg-[#181822] hover:bg-[#222230] text-[#A5A5AE] hover:text-white rounded-xl border border-[#282417] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#21D39B]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Wallet Address</span>
                </button>
              </div>
            </form>
          </div>

          {/* Global Backend & Cloudflare Database Synchronization */}
          <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#282417]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#E6B92F]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Global Centralized Database Synchronization
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE ENGINE
              </span>
            </div>

            <p className="text-xs text-[#A5A5AE] leading-relaxed">
              Customer registrations, live sessions, orders, and wallet adjustments synchronize persistently across Customer and Admin panels. When deploying on Cloudflare Pages, specify your centralized backend API URL (e.g. your Render/VPS URL or leave blank for default same-origin / localhost).
            </p>

            {apiSaved && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
                <span>Backend API Endpoint saved successfully!</span>
              </div>
            )}

            {connectionStatus && (
              <div className="p-3 rounded-xl bg-[#181822] border border-[#282417] text-xs flex items-center gap-2 font-mono text-zinc-300">
                <Activity className="w-4 h-4 text-[#E6B92F] shrink-0" />
                <span>{connectionStatus}</span>
              </div>
            )}

            {syncStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}

            <form onSubmit={handleSaveApiEndpoint} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">
                  Central Backend API URL (Optional if same-origin / localhost)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. http://localhost:3000 or https://api.my-nexo.com"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="flex-1 bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#E6B92F] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#d8ab25] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2 rounded-xl bg-[#181822] hover:bg-[#222230] text-[#E6B92F] border border-[#282417] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{testingConnection ? 'Testing Connection...' : 'Test Backend Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={forceSyncing}
                  className="px-3.5 py-2 rounded-xl bg-[#181822] hover:bg-[#222230] text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${forceSyncing ? 'animate-spin' : ''}`} />
                  <span>{forceSyncing ? 'Synchronizing...' : 'Force Sync Data Now'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security & Authentication Protocol */}
          <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#282417]">
              <Lock className="w-4 h-4 text-[#E6B92F]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Admin Authentication & Protection
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#A5A5AE]">
              <div className="flex justify-between p-2 rounded-xl bg-[#181822] border border-[#282417]">
                <span>Active Administrator:</span>
                <span className="font-mono text-white font-bold">@{currentAdmin.username}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#181822] border border-[#282417]">
                <span>Security Level:</span>
                <span className="text-[#21D39B] font-bold">Super Admin Backend Verified</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#181822] border border-[#282417]">
                <span>API Verification Protocol:</span>
                <span className="font-mono text-white">POST /api/admin/verify</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLETE PROJECT ZIP DOWNLOAD CARD (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111116] border-2 border-[#E6B92F]/60 rounded-3xl p-6 shadow-[0_10px_40px_rgba(230,185,47,0.15)] relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#E6B92F]/10 rounded-bl-full pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E6B92F] px-2.5 py-1 rounded-full bg-[#E6B92F]/15 border border-[#E6B92F]/30">
                Full Project Source Code
              </span>
              <span className="text-[10px] text-[#A5A5AE] font-mono">
                ZIP Archive (.zip)
              </span>
            </div>

            {/* Visual Icon Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c1708] to-[#121008] border border-[#E6B92F]/40 flex items-center gap-4 mb-4 shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-[#E6B92F]/20 border border-[#E6B92F] flex items-center justify-center text-[#E6B92F] shrink-0 shadow-md">
                <FolderArchive className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  NEXO Full Project ZIP
                </h4>
                <p className="text-[11px] text-[#A5A5AE] mt-0.5">
                  Complete ready-to-run package with both Customer & Admin applications.
                </p>
              </div>
            </div>

            {/* Content description */}
            <div className="space-y-2 text-xs text-[#A5A5AE] mb-5">
              <p className="leading-relaxed">
                Download the complete codebase for installation on your own server or hosting:
              </p>
              <ul className="space-y-1.5 text-[11px] text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6B92F]" />
                  <span><strong>Customer Panel</strong> (Landing page, 25-order tasks, wallet, profile)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6B92F]" />
                  <span><strong>Admin Panel</strong> (Left sidebar, customer wallet adjustments, products)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6B92F]" />
                  <span><strong>Express Backend</strong> (`server.ts`, auth endpoints, security routes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6B92F]" />
                  <span><strong>All Configs</strong> (`package.json`, TypeScript, Vite, Tailwind CSS)</span>
                </li>
              </ul>
            </div>

            {/* Download Status Alert */}
            {downloadSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-[#21D39B] shrink-0" />
                <span>ZIP downloaded successfully! Check your downloads folder.</span>
              </div>
            )}

            {/* Prominent One-Click Download Button */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#E6B92F] to-[#d8ab25] hover:from-[#f0c33a] hover:to-[#e0b42f] disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(230,185,47,0.3)] hover:shadow-[0_6px_25px_rgba(230,185,47,0.45)] cursor-pointer flex items-center justify-center gap-2"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isDownloadingZip ? 'Generating ZIP Archive...' : 'Download Complete Project (.ZIP)'}</span>
              <Download className="w-3.5 h-3.5 ml-1" />
            </button>

            <p className="text-[10px] text-center text-[#A5A5AE] mt-3">
              Ready to run with <code className="text-[#E6B92F] font-mono">npm install && npm run dev</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
