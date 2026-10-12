import React, { useState, useEffect } from 'react';
import { User as UserIcon, LogOut } from 'lucide-react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { ChatSupportModal } from './components/chat/ChatSupportModal';
import { CustomerMessageNotification } from './components/chat/CustomerMessageNotification';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { HomeDashboard } from './pages/HomeDashboard';
import { OrdersPage } from './pages/OrdersPage';
import { OrderRecordsPage } from './pages/OrderRecordsPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPortal } from './pages/admin/AdminPortal';
import { LandingPage } from './pages/LandingPage';
import { store, safeFetchJson, getApiUrl } from './services/store';
import { User } from './types';

export function App() {
  // CRITICAL FLOW REQUIREMENT:
  // Open Link -> Landing/Home Page -> Click Any Option -> Login Page -> After Login -> Access the App.
  // The first page should ALWAYS be the landing/home page shown in the screenshots.
  const [currentPage, setCurrentPage] = useState<'landing' | 'app' | 'admin'>('landing');

  // Active authenticated sessions
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);

  // Navigation tab in customer app
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      // Only refresh currentUser if current_user, users, or server_sync was modified
      if (key && key !== 'current_user' && key !== 'users' && key !== 'server_sync' && key !== 'broadcast') {
        return;
      }
      const fresh = store.getCurrentUser();
      setCurrentUser((prev) => {
        if (!prev && !fresh) return null;
        if (!prev || !fresh) return fresh;
        if (
          prev.id === fresh.id &&
          prev.username === fresh.username &&
          prev.tier === fresh.tier &&
          prev.status === fresh.status &&
          prev.avatarId === fresh.avatarId &&
          prev.isOnline === fresh.isOnline
        ) {
          return prev;
        }
        return fresh;
      });
    };
    window.addEventListener('nexo_storage_change', handleStorage);

    // Direct access to Admin Panel requires valid backend admin authentication
    const checkAdminRoute = async () => {
      const isDirectAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.search.includes('admin=true') ||
        window.location.hash.includes('admin');

      if (isDirectAdmin) {
        const token = store.getAdminToken();
        if (token) {
          try {
            const res = await safeFetchJson<{ valid: boolean; admin: User }>(
              getApiUrl('/api/admin/verify'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token }),
              }
            );
            if (res.ok && res.data?.valid && res.data?.admin) {
              setCurrentAdmin(res.data.admin);
              setCurrentPage('admin');
              return;
            }
          } catch {
            // Server verification failed
          }
        }
        // Direct access without verified token opens admin login
        setShowAdminLoginModal(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    return () => {
      window.removeEventListener('nexo_storage_change', handleStorage);
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  // Customer Heartbeat to keep live session and online status updated for Admin
  useEffect(() => {
    if (!currentUser?.id) return;
    store.pingHeartbeat(currentUser.id);
    const interval = setInterval(() => {
      store.pingHeartbeat(currentUser.id);
    }, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Customer Login Success
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    setCurrentPage('app');
  };

  // Admin Authentication Success
  const handleAdminAuthenticated = (adminUser: User) => {
    setCurrentAdmin(adminUser);
    setShowAdminLoginModal(false);
    setCurrentPage('admin');
  };

  // Logout Confirmation State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Request Logout (Shows Confirmation Dialog)
  const handleRequestLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Confirmed Logout
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (currentUser) {
      store.logoutCustomer(currentUser.id);
    }
    store.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentAdmin(null);
    setCurrentPage('landing');
    setShowLoginModal(false);
  };

  const getPageTitle = () => {
    if (currentPage === 'admin') return 'NEXO Admin Control Center';
    switch (activeTab) {
      case 'home':
        return 'Dashboard';
      case 'orders':
        return 'Orders';
      case 'records':
        return 'Order Records';
      case 'deposit':
        return 'Deposit';
      case 'profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#E6B92F]/20 selection:text-[#F4D66D]">
      {/* ============================================================== */}
      {/* 1. LANDING PAGE VIEW (Always first displayed when opening link) */}
      {/* ============================================================== */}
      {currentPage === 'landing' && (
        <>
          <LandingPage
            onAnyActionClick={() => setShowLoginModal(true)}
            onOpenAdminAuth={() => setShowAdminLoginModal(true)}
          />

          {/* Persistent Support Chat */}
          <ChatSupportModal currentUser={null} />
        </>
      )}

      {/* ============================================================== */}
      {/* 2. ADMIN PORTAL VIEW (Completely separated, protected by auth)  */}
      {/* ============================================================== */}
      {currentPage === 'admin' && currentAdmin && (
        <div className="min-h-screen bg-[#070709] text-white flex flex-col antialiased">
          <AdminPortal
            currentAdmin={currentAdmin}
            onExitAdmin={() => {
              if (currentUser) {
                setCurrentPage('app');
              } else {
                setCurrentPage('landing');
              }
            }}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CUSTOMER APPLICATION (Authenticated Member Panel)           */}
      {/* ============================================================== */}
      {currentPage === 'app' && currentUser && (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row antialiased">
          {/* Customer Desktop Sidebar (Contains secret double-click logo at bottom) */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentUser={currentUser}
            onLogout={handleRequestLogout}
            onOpenAdminAuth={() => setShowAdminLoginModal(true)}
          />

          {/* Customer Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              title={getPageTitle()}
              currentUser={currentUser}
              onOpenNotifications={() => setShowNotifications(true)}
              isAdminView={false}
              onLogout={handleRequestLogout}
            />

            <main className="flex-1 p-4 sm:p-6 md:p-8">
              {activeTab === 'home' && (
                <HomeDashboard
                  currentUser={currentUser}
                  onNavigateToOrders={() => setActiveTab('orders')}
                  onNavigateToRecords={() => setActiveTab('records')}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersPage
                  currentUser={currentUser}
                  onNavigateToWallet={() => setActiveTab('deposit')}
                />
              )}

              {activeTab === 'records' && (
                <OrderRecordsPage currentUser={currentUser} />
              )}

              {activeTab === 'deposit' && (
                <WalletPage currentUser={currentUser} />
              )}

              {activeTab === 'profile' && (
                <ProfilePage currentUser={currentUser} onLogout={handleRequestLogout} />
              )}
            </main>
          </div>

          {/* Customer Mobile Navigation */}
          <MobileNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Real-Time Incoming Support Message Notification Toast */}
          <CustomerMessageNotification
            currentUser={currentUser}
            onOpenChat={() => window.dispatchEvent(new CustomEvent('nexo_open_chat'))}
            isChatOpen={false}
          />

          {/* Customer Chat Support */}
          <ChatSupportModal currentUser={currentUser} />

          {/* Customer Notifications Modal */}
          <NotificationsModal
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            currentUser={currentUser}
          />

          {/* Universal Customer Logout Confirmation Popup */}
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
                    onClick={handleConfirmLogout}
                    className="flex-1 py-3 rounded-xl bg-[#FF4D4D] hover:bg-[#e03838] text-white text-xs font-extrabold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subtle Avatar-Style Icon at absolute bottom-right corner of Customer Panel */}
          {/* Right-click (contextmenu) or double-click navigates/opens the separate Admin Panel login page */}
          <div className="fixed bottom-2 right-2 z-40 select-none pointer-events-auto">
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                setShowAdminLoginModal(true);
              }}
              onDoubleClick={() => {
                setShowAdminLoginModal(true);
              }}
              tabIndex={-1}
              role="button"
              aria-label=""
              className="w-5 h-5 rounded-full bg-[#181822]/90 border border-[#282417] flex items-center justify-center text-[#A5A5AE]/40 hover:text-[#E6B92F] opacity-35 hover:opacity-90 transition-all cursor-default shadow-xs"
            >
              <UserIcon className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS & AUTHENTICATION SCREENS                                */}
      {/* ============================================================== */}
      {/* Customer Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onBackToHome={() => setShowLoginModal(false)}
      />

      {/* Customer Registration Modal with Referral Code */}
      <RegisterModal
        isOpen={showRegisterModal}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
        onBackToHome={() => setShowRegisterModal(false)}
        onRegistrationPending={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Admin Authentication Modal (Double-click entry point) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onAdminAuthenticated={handleAdminAuthenticated}
      />
    </div>
  );
}

export default App;
