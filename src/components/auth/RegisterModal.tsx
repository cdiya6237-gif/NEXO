import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, ArrowLeft, X, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../common/Logo';
import { store } from '../../services/store';

interface RegisterModalProps {
  isOpen: boolean;
  onSwitchToLogin: () => void;
  onBackToHome: () => void;
  onRegistrationPending: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onSwitchToLogin,
  onBackToHome,
}) => {
  // Required Signup fields in exactly this order:
  // 1. Full Name (blank input box)
  // 2. Username (blank input box)
  // 3. Password (blank password input box)
  // 4. Gmail / Email (blank input box)
  // 5. Phone Number (two separate blank input boxes: Country Code & Phone Number)
  // 6. Referral Code (Optional) (blank input box)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredRefCode, setRegisteredRefCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !fullName.trim() ||
      !username.trim() ||
      !password ||
      !email.trim() ||
      !countryCode.trim() ||
      !phoneNumber.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    // Combine manual country code and phone number
    const formattedPhone = `${countryCode.trim()} ${phoneNumber.trim()}`;

    // Check unique username
    const existingUser = store.getUser(cleanUsername);
    if (existingUser) {
      setError('This username is already taken. Please choose another.');
      return;
    }

    // Referral Code validation:
    // Optional. If customer has one, validate against genuine NEXO registered codes.
    // Invalid or nonexistent referral codes are rejected.
    let validatedReferrer: string | undefined = undefined;
    if (referralCode.trim()) {
      const codeToTest = referralCode.trim().toUpperCase();
      if (!store.isValidReferralCode(codeToTest)) {
        setError('Invalid Referral Code: Only valid referral codes registered in the NEXO system are accepted.');
        return;
      }
      validatedReferrer = codeToTest;
    }

    if (!acceptTerms) {
      setError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    // Generate unique NEXO referral code for this new customer
    const autoGenCode = `NEXO-${cleanUsername.toUpperCase().slice(0, 8)}`;
    setRegisteredRefCode(autoGenCode);

    // Create user account with chosen password
    const newUser = {
      id: 'user-' + Date.now(),
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email.trim(),
      phone: formattedPhone,
      passwordHash: password,
      role: 'member' as const,
      status: 'active' as const,
      tier: 'SILVER' as const,
      vipLevel: 'VIP 1' as const,
      avatarId: 1,
      referralCode: autoGenCode,
      referredBy: validatedReferrer,
      createdAt: new Date().toISOString(),
      notificationsEnabled: true,
      notes: validatedReferrer ? `Referred by valid NEXO code: ${validatedReferrer}` : undefined,
    };

    // Register customer in local store and sync immediately with backend API
    const regResult = await store.registerCustomer(newUser);
    if (!regResult.success && regResult.error) {
      setError(regResult.error);
      return;
    }

    // Record referral relationship if valid sponsor was provided
    if (validatedReferrer) {
      const referrerUser = store.getUser(validatedReferrer);
      const referrals = store.getReferrals();
      referrals.push({
        id: 'ref-' + Date.now(),
        referrerUsername: referrerUser ? referrerUser.username : validatedReferrer,
        referrerUserId: referrerUser?.id,
        referredUserId: newUser.id,
        referredUsername: newUser.username,
        referredFullName: newUser.fullName,
        referralCodeUsed: validatedReferrer,
        registrationDate: newUser.createdAt,
        status: 'active',
        commissionRate: 0.10, // 10% referral profit sharing
        totalCommissionGenerated: 0,
      });
      store.saveReferrals(referrals);

      if (referrerUser) {
        store.addNotification({
          userId: referrerUser.id,
          title: 'New Member Joined Network',
          message: `${newUser.fullName} (@${newUser.username}) registered using your referral code ${validatedReferrer}.`,
          type: 'referral',
        });
      }
    }

    // Audit log
    store.addAuditLog({
      adminId: 'system',
      adminName: 'Registration Engine',
      action: 'CUSTOMER_SIGNUP',
      target: `@${newUser.username}`,
      details: `Registered with assigned Referral Code: ${autoGenCode}. Sponsor Code: ${validatedReferrer || 'None'}`,
    });

    setSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-[430px] my-6 bg-[#111116] border border-[#3A321C] rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.85)] relative">
        {/* Back and Close buttons */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBackToHome}
            className="text-xs text-[#A5A5AE] hover:text-[#E6B92F] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to home</span>
          </button>

          <button
            onClick={onBackToHome}
            className="p-1 rounded-lg text-[#A5A5AE] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <Logo size="lg" />
          <h2 className="text-xl font-bold text-white mt-4 tracking-tight">
            Create Customer Account
          </h2>
          <p className="text-xs text-[#A5A5AE] mt-1">
            Join the <span className="text-[#E6B92F] font-semibold">NEXO</span> global commerce network
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#21D39B]/20 border border-[#21D39B] text-[#21D39B] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Account Created Successfully!</h3>
            <p className="text-xs text-[#A5A5AE] leading-relaxed">
              Your account (@{username}) has been created in the NEXO system.
            </p>
            <div className="p-3.5 bg-[#181822] rounded-xl border border-[#282417] text-left text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#A5A5AE]">Your Referral Code:</span>
                <span className="text-[#E6B92F] font-mono font-bold">{registeredRefCode}</span>
              </div>
              <p className="text-[11px] text-[#A5A5AE] pt-1 border-t border-[#282417]/60">
                You can now log in using your username and password.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccess(false);
                onSwitchToLogin();
              }}
              className="w-full py-3 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF4D4D] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form with Fields in Exact Required Order:
                1. Full Name
                2. Username
                3. Password
                4. Gmail / Email
                5. Phone Number (two separate blank inputs: Country Code & Phone Number)
                6. Referral Code (Optional)
            */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* 1. Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                  1. Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* 2. Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                  2. Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Username"
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* 3. Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                  3. Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 pr-10 py-2.5 text-xs focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#A5A5AE] hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. Gmail / Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                  4. Gmail / Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Gmail / Email"
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* 5. Phone Number (Country Code + Phone Number) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                  5. Phone Number
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-0.5">
                    <span className="text-[9px] text-[#A5A5AE] block">Country Code</span>
                    <input
                      type="text"
                      required
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="Country Code"
                      className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <span className="text-[9px] text-[#A5A5AE] block">Phone Number</span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Referral Code (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                    6. Referral Code (Optional)
                  </label>
                  <span className="text-[9px] font-bold text-[#E6B92F] uppercase tracking-wider">
                    Optional
                  </span>
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Referral Code (Optional)"
                  className="w-full bg-[#181822] border border-[#282417] focus:border-[#E6B92F] text-white font-mono rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-[#A5A5AE]">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#282417] bg-[#181822] text-[#E6B92F] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] leading-relaxed">
                    I accept the NEXO Platform Guidelines and 25-Order Verification Terms.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md mt-2 cursor-pointer"
              >
                Sign Up
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-[#A5A5AE]">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-[#E6B92F] hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
