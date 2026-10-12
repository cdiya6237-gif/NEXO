import React from 'react';
import {
  Shield,
  Award,
  Headphones,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Layers,
  Users,
  Store,
  Gift,
  Compass,
  Heart,
  Target,
  Globe,
  Wallet,
  Box,
  TrendingUp,
  Search,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onAnyActionClick: () => void;
  onOpenAdminAuth?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAnyActionClick,
  onOpenAdminAuth,
}) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between selection:bg-[#E6B92F]/20 selection:text-[#F4D66D] font-sans antialiased">
      {/* ============================================================== */}
      {/* 1. HEADER (Reference: ~940 × 52 px centered container)         */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-[#282417]/70">
        <div className="max-w-[940px] w-full mx-auto h-[52px] px-3 sm:px-4 flex items-center justify-between gap-2">
          {/* Logo: ~68 × 38 px, NEXO text ~18px, Tagline ~6-7px */}
          <div
            onClick={onAnyActionClick}
            className="flex items-center gap-1.5 cursor-pointer w-[80px] sm:w-[90px] shrink-0"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[#E6B92F] to-[#b38814] flex items-center justify-center text-black font-black text-sm shadow-sm">
              N
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[17px] sm:text-[18px] font-black tracking-tight text-white">
                NEXO
              </span>
              <span className="text-[6.5px] font-bold text-[#E6B92F] tracking-widest uppercase">
                COMMERCE
              </span>
            </div>
          </div>

          {/* Navigation Links: Font ~11-12px, gap ~18-22px */}
          <nav className="hidden md:flex items-center gap-[18px] lg:gap-[20px] text-[11px] lg:text-[12px] font-bold text-[#A5A5AE]">
            <button
              onClick={onAnyActionClick}
              className="text-[#E6B92F] hover:text-[#F4D66D] transition-colors cursor-pointer"
            >
              HOME
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              SHOP
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              DEALS
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              TASKS & EARN
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              AFFILIATE
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              RESELL
            </button>
            <button
              onClick={onAnyActionClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              REWARDS
            </button>
          </nav>

          {/* Right Area: Search Box (~165 × 24 px) + Login/Signup (~85 × 24 px) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Box: ~165 × 24 px, border radius ~14px, text ~8-9px */}
            <div
              onClick={onAnyActionClick}
              className="hidden sm:flex items-center bg-[#111116] border border-[#282417] rounded-[14px] w-[140px] md:w-[165px] h-[24px] px-2 cursor-pointer hover:border-[#E6B92F]/40 transition-colors"
            >
              <Search className="w-3 h-3 text-[#A5A5AE] mr-1.5 shrink-0" />
              <span className="text-[#A5A5AE] text-[8.5px] truncate">
                Search products, brands...
              </span>
            </div>

            {/* Login / Sign Up: ~85 × 24 px, font ~8-9px */}
            <button
              onClick={onAnyActionClick}
              className="w-[85px] h-[24px] rounded-[12px] bg-[#181822] hover:bg-[#222232] text-[#E6B92F] border border-[#E6B92F]/40 font-bold text-[8.5px] flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
            >
              Login / Sign Up
            </button>

            {/* Cart Icon */}
            <button
              onClick={onAnyActionClick}
              className="relative p-1 rounded-lg bg-[#111116] border border-[#282417] text-[#A5A5AE] hover:text-white cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E6B92F] text-black text-[9px] font-bold flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN CONTAINER (~940px width centered)                      */}
      {/* ============================================================== */}
      <main className="max-w-[940px] w-full mx-auto px-3 sm:px-4 py-5 space-y-9">
        {/* ============================================================== */}
        {/* HERO SECTION (~940 × 490 px)                                   */}
        {/* ============================================================== */}
        <section className="relative min-h-[460px] md:min-h-[490px] flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* ---------------------------------------------------------- */}
            {/* Left Side: Top Badge, Main Heading, Description, Buttons   */}
            {/* ---------------------------------------------------------- */}
            <div className="lg:col-span-6 space-y-4">
              {/* Top Badge: ~265 × 31 px, border radius ~17px, text ~9-10px */}
              <div
                onClick={onAnyActionClick}
                className="inline-flex items-center gap-1.5 px-3 h-[31px] rounded-[17px] bg-[#181822] border border-[#E6B92F]/40 text-[#E6B92F] text-[9.5px] font-bold cursor-pointer hover:bg-[#20202d] transition-colors shadow-sm max-w-[280px]"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">NEXO — Connecting the World Through Commerce.</span>
              </div>

              {/* Main Heading: ~310 × 190 px block, font 39-40px, weight 800, line-height 46px, letter-spacing -1px */}
              <div className="max-w-[330px]">
                <h1 className="text-[36px] sm:text-[39px] font-[800] text-white tracking-[-1px] leading-[44px] sm:leading-[46px] uppercase">
                  MORE THAN
                  <br />
                  SHOPPING.
                  <br />
                  <span className="text-[#E6B92F]">IT'S A WAY TO</span>
                  <br />
                  <span className="text-[#E6B92F]">EARN.</span>
                </h1>
              </div>

              {/* Description: ~370 px width, font ~11-12px, line-height ~17px, 2 lines */}
              <p className="max-w-[370px] text-[11.5px] leading-[17px] text-zinc-300">
                Shop Top Quality Products, Complete Tasks, Refer & Earn, Resell & Grow with Unlimited Rewards across verified global e-commerce pipelines.
              </p>

              {/* Action Buttons: SHOP NOW (127 × 36 px) + START EARNING (134 × 36 px), gap ~11px */}
              <div className="flex items-center gap-[11px] pt-1">
                {/* SHOP NOW Button: 127 × 36 px, border radius 8px, font 11px */}
                <button
                  onClick={onAnyActionClick}
                  className="w-[127px] h-[36px] rounded-[8px] bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(230,185,47,0.3)] cursor-pointer shrink-0"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {/* START EARNING Button: 134 × 36 px, border radius 8px, font 10-11px */}
                <button
                  onClick={onAnyActionClick}
                  className="w-[134px] h-[36px] rounded-[8px] bg-[#111116] hover:bg-[#181822] text-white border border-[#282417] hover:border-[#E6B92F]/50 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  START EARNING
                </button>
              </div>

              {/* Bottom Hero Text: Font ~9-11px, Secondary ~8-9px */}
              <div
                onClick={onAnyActionClick}
                className="flex items-center gap-2 text-[9.5px] text-[#A5A5AE] cursor-pointer pt-1"
              >
                <span className="font-bold text-[#E6B92F]">NEXO</span>
                <span>— ONE PLATFORM. UNLIMITED POSSIBILITIES.</span>
                <span>•</span>
                <span className="text-[#21D39B] font-semibold text-[8.5px]">25-Order Cycles</span>
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Center Main Box + Right 4 Small Boxes                      */}
            {/* ---------------------------------------------------------- */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Main Task Card: ~296 × 296 px, border radius ~17px, border ~1px, dark transparent/gradient */}
              <div
                onClick={onAnyActionClick}
                className="w-[296px] h-[296px] rounded-[17px] bg-gradient-to-br from-[#161620]/95 via-[#111117] to-[#0c0c10] border border-[#3A321C] shadow-2xl p-4 flex flex-col justify-between items-center text-center cursor-pointer hover:border-[#E6B92F]/70 transition-all shrink-0 relative group"
              >
                {/* Badge: ~117 × 27 px, font ~9px */}
                <div className="w-[117px] h-[27px] rounded-md bg-[#1c1708] border border-[#E6B92F]/40 flex items-center justify-center text-[#E6B92F] text-[9px] font-black uppercase tracking-widest shadow-sm">
                  NEXO TASK DEALS
                </div>

                {/* Circular NEXO Logo: ~108 × 108 px, border ~5px, text ~22px */}
                <div className="w-[108px] h-[108px] rounded-full bg-[#18140a] border-[5px] border-[#E6B92F] flex flex-col items-center justify-center shadow-[0_0_24px_rgba(230,185,47,0.35)] group-hover:scale-105 transition-transform my-1">
                  <span className="text-[22px] font-black text-white tracking-tight leading-none">
                    NEXO
                  </span>
                  <span className="text-[7.5px] font-extrabold text-[#E6B92F] tracking-widest uppercase mt-0.5">
                    REWARDS
                  </span>
                </div>

                {/* Text: font ~13-14px, weight 800 */}
                <div className="space-y-0.5">
                  <h3 className="font-[800] text-[13.5px] text-[#F4D66D] tracking-wide uppercase leading-tight">
                    YOUR EFFORT. YOUR REWARD.
                  </h3>
                  {/* Star Rating: 5 stars ~13px each */}
                  <div className="flex items-center justify-center gap-1 text-[#E6B92F] text-[13px] pt-0.5">
                    {'★★★★★'}
                  </div>
                </div>

                {/* Bottom Verification Box: ~258 × 39 px, border radius ~10px, font ~8-9px */}
                <div className="w-[258px] h-[39px] rounded-[10px] bg-black/60 border border-[#282417] px-3 flex items-center justify-between text-[8.5px] text-[#A5A5AE] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Box className="w-3 h-3 text-[#E6B92F]" />
                    <span>Live Order Pipeline</span>
                  </span>
                  <span className="text-[#21D39B] font-bold">100% Verified</span>
                </div>
              </div>

              {/* Right Side — 4 Small Boxes: 136 × 50-57 px, gap ~10-12px, border radius ~12px */}
              <div className="flex flex-col gap-[10px] shrink-0">
                {/* 1. Trusted: ~136 × 50 px */}
                <div
                  onClick={onAnyActionClick}
                  className="w-[136px] h-[50px] rounded-[12px] bg-[#111116] border border-[#282417] p-2 flex items-center gap-2 cursor-pointer hover:border-[#E6B92F]/40 transition-colors"
                >
                  <div className="w-[26px] h-[26px] rounded-lg bg-[#181822] text-[#E6B92F] flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-tight">
                    <h4 className="text-[9px] font-bold text-white">Trusted</h4>
                    <span className="text-[7.5px] text-[#A5A5AE]">Secure & Safe</span>
                  </div>
                </div>

                {/* 2. Quality: ~136 × 50 px */}
                <div
                  onClick={onAnyActionClick}
                  className="w-[136px] h-[50px] rounded-[12px] bg-[#111116] border border-[#282417] p-2 flex items-center gap-2 cursor-pointer hover:border-[#E6B92F]/40 transition-colors"
                >
                  <div className="w-[26px] h-[26px] rounded-lg bg-[#181822] text-[#E6B92F] flex items-center justify-center shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-tight">
                    <h4 className="text-[9px] font-bold text-white">Quality</h4>
                    <span className="text-[7.5px] text-[#A5A5AE]">Top Products</span>
                  </div>
                </div>

                {/* 3. Support: ~136 × 57 px */}
                <div
                  onClick={onAnyActionClick}
                  className="w-[136px] h-[57px] rounded-[12px] bg-[#111116] border border-[#282417] p-2 flex items-center gap-2 cursor-pointer hover:border-[#E6B92F]/40 transition-colors"
                >
                  <div className="w-[26px] h-[26px] rounded-lg bg-[#181822] text-[#E6B92F] flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-tight">
                    <h4 className="text-[9px] font-bold text-white">Support</h4>
                    <span className="text-[7.5px] text-[#A5A5AE]">24/7 Desk Live</span>
                  </div>
                </div>

                {/* 4. Secure: ~136 × 57 px */}
                <div
                  onClick={onAnyActionClick}
                  className="w-[136px] h-[57px] rounded-[12px] bg-[#111116] border border-[#282417] p-2 flex items-center gap-2 cursor-pointer hover:border-[#E6B92F]/40 transition-colors"
                >
                  <div className="w-[26px] h-[26px] rounded-lg bg-[#181822] text-[#E6B92F] flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-tight">
                    <h4 className="text-[9px] font-bold text-white">Secure</h4>
                    <span className="text-[7.5px] text-[#A5A5AE]">Priority Safety</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. SIX FEATURE BOXES ROW (~940 × 108 px)                       */}
        {/* ============================================================== */}
        <section className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[11px]">
            {[
              { title: 'SHOP', desc: 'Top Brands', icon: ShoppingBag },
              { title: 'TASKS & EARN', desc: '25 Orders Cycle', icon: Layers },
              { title: 'AFFILIATE', desc: '10% Overrides', icon: Users },
              { title: 'RESELL', desc: 'Sell & Earn', icon: Store },
              { title: 'REWARDS', desc: 'Instant Yield', icon: Gift },
              { title: 'TRUST', desc: '100% Verified', icon: Shield },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  onClick={onAnyActionClick}
                  className="h-[107px] rounded-[11px] bg-[#111116] hover:bg-[#16161f] border border-[#282417] hover:border-[#E6B92F]/40 p-3 flex flex-col justify-between cursor-pointer transition-all group"
                >
                  <div className="w-[26px] h-[26px] rounded-lg bg-[#181822] text-[#E6B92F] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[9.5px] font-bold text-white group-hover:text-[#E6B92F] transition-colors leading-tight">
                      {card.title}
                    </h4>
                    <span className="text-[7.5px] text-[#A5A5AE] block mt-0.5 leading-tight">
                      {card.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. TRUST / INFO BAR (~940 × 45 px)                             */}
        {/* ============================================================== */}
        <section className="h-[45px] rounded-xl bg-[#0c0c10] border border-[#282417]/80 px-4 flex items-center justify-between text-[#A5A5AE]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#21D39B]" />
            <span className="text-[8.5px] font-semibold text-white">
              Trusted by Thousands of Users Worldwide
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#E6B92F] font-bold text-[8.5px]">
            <span>★ 4.8/5</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[7.5px] font-bold tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-[#E6B92F]" /> SSL SECURED
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-[#21D39B]" /> PCI DSS COMPLIANT
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-2.5 h-2.5 text-[#E6B92F]" /> 100% SECURE PAYMENT
            </span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. BRAND ESSENCE SECTION (~940 × 190+ px)                      */}
        {/* ============================================================== */}
        <section className="text-center space-y-6 pt-4">
          <div className="space-y-2">
            {/* Pill: ~132 × 31 px, border radius ~16px, font ~10px */}
            <div
              onClick={onAnyActionClick}
              className="inline-flex items-center justify-center gap-1.5 w-[140px] h-[31px] rounded-[16px] bg-[#181822] border border-[#E6B92F]/40 text-[#E6B92F] text-[10px] font-bold uppercase tracking-wider mx-auto cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>NEXO BRAND ESSENCE</span>
            </div>

            {/* Big Heading: Font size ~42-45px, weight 800 */}
            <h2 className="text-[28px] sm:text-[38px] md:text-[44px] font-[800] text-white tracking-tight uppercase leading-tight">
              NEXO <span className="text-[#E6B92F]">VISION. EMPOWERMENT. OPPORTUNITY.</span>
            </h2>

            <p className="text-[11.5px] text-[#A5A5AE] max-w-xl mx-auto leading-relaxed">
              NEXO represents three fundamental pillars designed to drive global growth and digital prosperity.
            </p>
          </div>

          {/* 3 Pillar Cards: V, E, O */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            {/* V — VISION */}
            <div
              onClick={onAnyActionClick}
              className="p-5 rounded-2xl bg-[#111116] border border-[#282417] hover:border-[#E6B92F]/50 transition-all cursor-pointer space-y-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#181822] text-[#E6B92F] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">V — VISION</h3>
                <span className="text-[9px] font-bold text-[#E6B92F] uppercase block">
                  A FORWARD-THINKING ECOSYSTEM
                </span>
              </div>
              <p className="text-[11px] text-[#A5A5AE] leading-relaxed">
                To become the world's most trusted digital commerce ecosystem, empowering people everywhere to connect, grow, and unlock new opportunities.
              </p>
            </div>

            {/* E — EMPOWERMENT */}
            <div
              onClick={onAnyActionClick}
              className="p-5 rounded-2xl bg-[#111116] border border-[#282417] hover:border-[#E6B92F]/50 transition-all cursor-pointer space-y-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#181822] text-[#E6B92F] flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">E — EMPOWERMENT</h3>
                <span className="text-[9px] font-bold text-[#E6B92F] uppercase block">
                  TOOLS & SECURITY TO SUCCEED
                </span>
              </div>
              <p className="text-[11px] text-[#A5A5AE] leading-relaxed">
                Providing buyers, sellers, creators, and entrepreneurs with trusted technology, transparent reward structures, and full economic security.
              </p>
            </div>

            {/* O — OPPORTUNITY */}
            <div
              onClick={onAnyActionClick}
              className="p-5 rounded-2xl bg-[#111116] border border-[#282417] hover:border-[#E6B92F]/50 transition-all cursor-pointer space-y-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#181822] text-[#E6B92F] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">O — OPPORTUNITY</h3>
                <span className="text-[9px] font-bold text-[#E6B92F] uppercase block">
                  UNLIMITED EARNING POTENTIAL
                </span>
              </div>
              <p className="text-[11px] text-[#A5A5AE] leading-relaxed">
                Unlocking accessible financial channels through shopping, task cycles, referral programs, and reselling on a single global marketplace.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="border-t border-[#282417]/80 bg-[#08080a] py-6 px-4 text-xs text-[#A5A5AE] mt-10">
        <div className="max-w-[940px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
          <div onClick={onAnyActionClick} className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded bg-[#E6B92F] text-black font-black text-[10px] flex items-center justify-center">
              N
            </div>
            <span className="font-bold text-white tracking-wide">NEXO COMMERCE</span>
          </div>

          <div className="flex items-center gap-4 text-[9px]">
            <span>🔒 SSL SECURED</span>
            <span>🛡 PCI DSS COMPLIANT</span>
            <span>⚡ 100% SECURE PAYMENT</span>
          </div>

          <div className="flex items-center gap-2">
            <span>© 2026 NEXO Platform. All rights reserved.</span>
            {onOpenAdminAuth && (
              <button
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenAdminAuth();
                }}
                className="w-3 h-3 text-[#A5A5AE]/20 hover:text-[#E6B92F] cursor-default transition-colors"
                title=""
              >
                <Shield className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
