import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Wallet,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  Key,
  Users,
  Bell,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { store } from '../services/store';
import { AvatarSelectionModal } from '../components/profile/AvatarSelectionModal';

interface ProfilePageProps {
  currentUser: User;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onLogout }) => {
  const [user, setUser] = useState<User>(currentUser);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [expandReferrals, setExpandReferrals] = useState(true);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Address change state
  const [newAddress, setNewAddress] = useState(user.withdrawAddress || '');
  const [addrSuccess, setAddrSuccess] = useState('');

  // 8 Curated Avatars
  const avatarChoices = [
    { id: 1, label: 'Gold Ring', color: 'from-[#E6B92F] to-[#b38b17]' },
    { id: 2, label: 'Emerald Emerald', color: 'from-[#21D39B] to-[#128a64]' },
    { id: 3, label: 'Royal Obsidian', color: 'from-[#3A321C] to-[#111116]' },
    { id: 4, label: 'Sapphire Modern', color: 'from-[#3b82f6] to-[#1d4ed8]' },
    { id: 5, label: 'Amber Flame', color: 'from-[#f59e0b] to-[#d97706]' },
    { id: 6, label: 'Rose Gold', color: 'from-[#fb7185] to-[#e11d48]' },
    { id: 7, label: 'Platinum Steel', color: 'from-[#94a3b8] to-[#475569]' },
    { id: 8, label: 'Amethyst VIP', color: 'from-[#a855f7] to-[#7e22ce]' },
  ];

  const maskEmail = (email: string) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 4) {
      return `${name.slice(0, 1)}***${name.slice(-1)}@${domain}`;
    }
    const visible = name.slice(-4);
    const masked = '*'.repeat(name.length - 4) + visible;
    return `${masked}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return 'N/A';
    const clean = phone.trim();
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    const preceding = clean.slice(0, -4);
    const maskedPreceding = preceding.replace(/[0-9]/g, '*');
    return `${maskedPreceding}${last4}`;
  };

  const maskAddress = (addr?: string) => {
    if (!addr) return 'Not Set';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const handleCopy = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSelectAvatar = (avatarId: number) => {
    const updated = { ...user, avatarId };
    store.updateUser(updated);
    setUser(updated);
    setShowAvatarModal(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (currentPass !== user.passwordHash) {
      setPassError('Current password does not match.');
      return;
    }

    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    const updated = { ...user, passwordHash: newPass };
    store.updateUser(updated);
    setUser(updated);
    setPassSuccess('Password updated successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPassSuccess('');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }, 1500);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...user, withdrawAddress: newAddress.trim() };
    store.updateUser(updated);
    setUser(updated);
    setAddrSuccess('Withdrawal address saved!');
    setTimeout(() => {
      setShowAddressModal(false);
      setAddrSuccess('');
    }, 1200);
  };

  const handleToggleNotifications = () => {
    const updated = { ...user, notificationsEnabled: !user.notificationsEnabled };
    store.updateUser(updated);
    setUser(updated);
  };

  // Referral metrics (matching either username or referral code)
  const allRefs = store.getReferrals();
  const referrals = allRefs.filter(
    r => r.referrerUsername.toLowerCase() === user.username.toLowerCase() ||
         r.referrerUsername.toLowerCase() === user.referralCode.toLowerCase()
  );
  const referralEarnings = referrals.reduce((sum, r) => sum + r.totalCommissionGenerated, 0);

  const displayRefCode = user.referralCode || `NEXO-${user.username.toUpperCase()}`;
  const referralLink = `https://nexo.commerce/ref/${displayRefCode}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* 1. Profile Information Card */}
      <div className="bg-[#111116] border border-[#3A321C] rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            onClick={() => setShowAvatarModal(true)}
            className="relative cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#E6B92F] text-black font-extrabold text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(230,185,47,0.3)] border-2 border-[#E6B92F]/60 group-hover:scale-105 transition-transform">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{user.fullName ? user.fullName.charAt(0) : 'U'}</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAvatarModal(true);
              }}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#181822] text-[#E6B92F] border border-[#282417] flex items-center justify-center text-[10px] hover:bg-[#20202d] cursor-pointer shadow-md"
              title="Change Profile Avatar"
            >
              ✎
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {user.fullName}
            </h3>
            <span className="text-xs text-[#A5A5AE] font-mono block">
              @{user.username}
            </span>

            {/* Badges */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#181822] text-[#21D39B] border border-[#21D39B]/30 tracking-wider">
                POST_COMPLETE
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#181822] text-[#E6B92F] border border-[#E6B92F]/30 tracking-wider">
                {user.tier}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIP Levels Card */}
      <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 space-y-4 shadow-xl">
        <span className="text-xs font-bold text-white tracking-tight">VIP Levels</span>
        <div className="grid grid-cols-3 gap-3">
          {[
            { level: 'VIP1', rate: '25%', active: user.vipLevel === 'VIP 1' },
            { level: 'VIP2', rate: '25%', active: user.vipLevel === 'VIP 2' },
            { level: 'VIP3', rate: '25%', active: user.vipLevel === 'VIP 3' },
          ].map((v) => (
            <div
              key={v.level}
              className={`p-3.5 rounded-2xl text-center border transition-all ${
                v.active
                  ? 'bg-[#181822] border-[#E6B92F]/60 shadow-[0_0_12px_rgba(230,185,47,0.15)]'
                  : 'bg-[#14141a] border-[#282417] opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold text-[#A5A5AE] uppercase block">
                {v.level}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#E6B92F] mt-0.5 block">
                {v.rate}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Contact Information Card */}
      <div className="bg-[#111116] border border-[#282417] rounded-3xl p-6 space-y-4 shadow-xl">
        {/* Email */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#282417]/50">
          <div className="flex items-center gap-2.5 text-[#A5A5AE]">
            <Mail className="w-4 h-4 text-[#E6B92F]" />
            <span>Email</span>
          </div>
          <span className="font-mono text-zinc-300 font-medium">
            {maskEmail(user.email)}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#282417]/50">
          <div className="flex items-center gap-2.5 text-[#A5A5AE]">
            <Phone className="w-4 h-4 text-[#E6B92F]" />
            <span>Phone</span>
          </div>
          <span className="font-mono text-zinc-300 font-medium">
            {maskPhone(user.phone)}
          </span>
        </div>

        {/* Withdraw Address */}
        <div className="flex items-center justify-between text-xs py-1.5">
          <div className="flex items-center gap-2.5 text-[#A5A5AE]">
            <Wallet className="w-4 h-4 text-[#E6B92F]" />
            <span>Withdraw Address</span>
          </div>
          <span className="font-mono text-zinc-300 font-medium">
            {maskAddress(user.withdrawAddress)}
          </span>
        </div>
      </div>

      {/* 4. Settings & Referral Menu Items */}
      <div className="bg-[#111116] border border-[#282417] rounded-3xl divide-y divide-[#282417]/60 overflow-hidden shadow-xl">
        {/* Change Profile Avatar */}
        <button
          onClick={() => setShowAvatarModal(true)}
          className="w-full p-4.5 flex items-center justify-between text-xs hover:bg-[#181822] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <UserIcon className="w-4 h-4 text-[#E6B92F]" />
            <span className="font-semibold text-white">Change Profile Avatar</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A5A5AE]" />
        </button>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full p-4.5 flex items-center justify-between text-xs hover:bg-[#181822] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-[#E6B92F]" />
            <span className="font-semibold text-white">Change Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A5A5AE]" />
        </button>

        {/* Set Withdrawal Address */}
        <button
          onClick={() => setShowAddressModal(true)}
          className="w-full p-4.5 flex items-center justify-between text-xs hover:bg-[#181822] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-[#E6B92F]" />
            <span className="font-semibold text-white">Set Withdrawal Address</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A5A5AE]" />
        </button>

        {/* Referral Program & Invite (Collapsible) */}
        <div>
          <button
            onClick={() => setExpandReferrals(!expandReferrals)}
            className="w-full p-4.5 flex items-center justify-between text-xs hover:bg-[#181822] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#E6B92F]" />
              <span className="font-semibold text-white">Referral Program & Invite (10% Profit Sharing)</span>
            </div>
            {expandReferrals ? (
              <ChevronDown className="w-4 h-4 text-[#A5A5AE]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#A5A5AE]" />
            )}
          </button>

          {expandReferrals && (
            <div className="p-4 sm:p-6 bg-[#0e0e12] border-t border-[#282417]/60 space-y-5 animate-in fade-in duration-150">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-[#14141a] p-4 rounded-2xl border border-[#282417]">
                  <span className="text-[10px] uppercase font-bold text-[#A5A5AE]">TOTAL REFERRALS</span>
                  <span className="text-xl font-bold text-white block mt-1">{referrals.length}</span>
                </div>
                <div className="bg-[#14141a] p-4 rounded-2xl border border-[#282417]">
                  <span className="text-[10px] uppercase font-bold text-[#A5A5AE]">ACTIVE</span>
                  <span className="text-xl font-bold text-[#21D39B] block mt-1">
                    {referrals.filter(r => r.status === 'active').length}
                  </span>
                </div>
                <div className="bg-[#14141a] p-4 rounded-2xl border border-[#282417]">
                  <span className="text-[10px] uppercase font-bold text-[#A5A5AE]">EARNINGS</span>
                  <span className="text-xl font-bold text-white block mt-1">${referralEarnings.toFixed(2)}</span>
                </div>
                <div className="bg-[#14141a] p-4 rounded-2xl border border-[#282417]">
                  <span className="text-[10px] uppercase font-bold text-[#A5A5AE]">COMMISSION RATE</span>
                  <span className="text-xl font-bold text-[#E6B92F] block mt-1">10%</span>
                  <span className="text-[9px] text-[#A5A5AE]">Of Referred Member Profits</span>
                </div>
              </div>

              {/* Share & Earn with Visible Referral Code */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white">Your Personal Referral Credentials</span>

                {/* Referral Code Box */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Your Unique Referral Code</label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181822] border border-[#E6B92F]/50">
                    <span className="text-sm text-[#E6B92F] font-black font-mono tracking-wider flex-1">
                      {displayRefCode}
                    </span>
                    <button
                      onClick={() => handleCopy(displayRefCode, false)}
                      className="p-1.5 rounded-lg text-[#A5A5AE] hover:text-[#E6B92F] cursor-pointer"
                      title="Copy Referral Code"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-[#21D39B]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase">Your Referral Link</label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181822] border border-[#282417]">
                    <span className="text-xs text-zinc-300 truncate flex-1 font-mono">
                      {referralLink}
                    </span>
                    <button
                      onClick={() => handleCopy(referralLink, true)}
                      className="p-1.5 rounded-lg text-[#A5A5AE] hover:text-[#E6B92F] cursor-pointer"
                      title="Copy Link"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-[#21D39B]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Your Referrals List */}
              <div className="space-y-2 pt-2 border-t border-[#282417]/60">
                <span className="text-xs font-bold text-white">Referred Members ({referrals.length})</span>
                {referrals.length === 0 ? (
                  <p className="text-xs text-[#A5A5AE] py-3 text-center">
                    No referrals registered yet. Share your code to earn 10% on every completed order profit!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {referrals.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-[#181822] border border-[#282417] flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">@{r.referredUsername}</span>
                          <span className="text-[10px] text-[#A5A5AE] block">{r.referredFullName}</span>
                        </div>
                        <span className="text-[#21D39B] font-bold tabular-nums">
                          +${r.totalCommissionGenerated.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Settings */}
        <div className="p-4.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#E6B92F]" />
            <span className="font-semibold text-white">Notifications Settings</span>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
              user.notificationsEnabled
                ? 'bg-[#181822] text-[#21D39B] border-[#21D39B]/30'
                : 'bg-[#181822] text-[#A5A5AE] border-[#282417]'
            }`}
          >
            {user.notificationsEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full py-4 rounded-2xl bg-[#FF4D4D] hover:bg-[#e03838] text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>

      {/* MODAL: Change Avatar & Photo Upload */}
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentUser={user}
        onAvatarUpdated={(updated) => setUser(updated)}
      />

      {/* CONFIRMATION POPUP: Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111116] border border-[#3A321C] rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-[#FF4D4D] mx-auto flex items-center justify-center shadow-inner">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Log Out Confirmation
              </h3>
              <p className="text-xs text-[#A5A5AE] leading-relaxed">
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#181822] hover:bg-[#20202d] text-[#A5A5AE] hover:text-white text-xs font-bold transition-colors cursor-pointer border border-[#282417]"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF4D4D] hover:bg-[#e03838] text-white text-xs font-extrabold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#111116] border border-[#3A321C] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Change Password</h3>

            {passError && <p className="text-xs text-[#FF4D4D]">{passError}</p>}
            {passSuccess && <p className="text-xs text-[#21D39B]">{passSuccess}</p>}

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#A5A5AE]">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-[#181822] border border-[#282417] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E6B92F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A5A5AE]">New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-[#181822] border border-[#282417] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E6B92F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A5A5AE]">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-[#181822] border border-[#282417] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E6B92F]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#181822] text-[#A5A5AE] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Set Withdrawal Address */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#111116] border border-[#3A321C] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Set Withdrawal Address</h3>

            {addrSuccess && <p className="text-xs text-[#21D39B]">{addrSuccess}</p>}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#A5A5AE]">USDT TRC20 Wallet Address</label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. TKe7jmn1..."
                  className="w-full bg-[#181822] border border-[#282417] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#E6B92F]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#181822] text-[#A5A5AE] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
