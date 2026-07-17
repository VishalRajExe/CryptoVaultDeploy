import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  TrendingUp,
  Briefcase,
  ArrowLeftRight,
  Star,
  Wallet as WalletIcon,
  ShieldCheck,
  LogOut,
  Menu,
  Users,
  Banknote,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  CreditCard,
  Bell,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { sendVerificationOtp, verifyAccountOtp, getMyNotifications, markNotificationsRead } from '../../api/auth';
import { Loader2, AlertTriangle } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import ChatWidget from '../../components/ChatWidget';
import AgeConfirmation from '../../components/AgeConfirmation';

const userNavItems = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/markets', label: 'Markets', icon: TrendingUp },
  { to: '/app/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/app/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/watchlist', label: 'Watchlist', icon: Star },
  { to: '/app/wallet', label: 'Wallet', icon: WalletIcon },
  { to: '/app/security', label: 'Security', icon: ShieldCheck },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/app/ai-assistants', label: 'AI Assistants', icon: Sparkles },
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
];

const adminNavItems = [
  { to: '/app/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/admin/wallets', label: 'Wallets', icon: WalletIcon },
  { to: '/app/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
  { to: '/app/admin/activity', label: 'Activity', icon: Activity },
  { to: '/app/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/app/admin/notifications', label: 'Notifications', icon: Bell },
];

function SidebarContent({ onNavigate, collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-outline-variant">
        <img src="/favicon.svg" alt="CryptoVault Logo" className="w-8 h-8 shrink-0" />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="font-display text-base font-bold tracking-tight text-primary">
              CryptoVault
            </span>
          </motion.div>
        )}
      </div>

      {/* Nav Links — scrolls internally, logout footer stays pinned */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
        {navItems.map((item) => {
          const isActive =
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex items-center gap-3 px-4 py-3 mx-1 rounded-lg text-sm transition-all duration-200 ease-in-out relative ${
                isActive
                  ? 'text-on-primary-container font-bold bg-primary-container shadow-sm'
                  : 'text-muted-tertiary hover:text-on-background hover:bg-surface-variant'
              }`}
            >
              <item.icon
                size={18}
                className={`shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                  isActive ? 'text-on-primary-container' : 'text-muted-tertiary group-hover:text-on-background'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && <span className="font-button text-button">{item.label}</span>}
              {isActive && !collapsed && (
                <motion.span
                  layoutId="activeSideIndicator"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-on-primary-container"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-outline-variant">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center font-bold text-xs text-primary-container">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-on-surface truncate leading-tight">
                {user?.fullName || 'Trader'}
              </div>
              <div className="text-[10px] text-secondary font-semibold leading-none mt-1">
                {isAdmin ? 'Admin desk' : 'Verified desk'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-tertiary hover:text-error hover:bg-error-container/10 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span className="font-button text-button">Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isEmailVerified = !!(user?.isVerified || user?.verified);
  const isUnverified = !isEmailVerified && !isAdmin;
  const { push } = useToast();
  const [resending, setResending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { refresh, setUser } = useAuth();
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    if (!user) return;
    const checkPopups = () => {
      getMyNotifications()
        .then((data) => {
          if (Array.isArray(data)) {
            const popup = data.find((n) => n.type === 'POPUP' && !n.read);
            if (popup) {
              setActivePopup(popup);
            }
          }
        })
        .catch(() => {});
    };
    checkPopups();
    const interval = setInterval(checkPopups, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDismissPopup = async () => {
    if (!activePopup) return;
    try {
      await markNotificationsRead();
      setActivePopup(null);
      push('Announcement dismissed.', 'success');
    } catch (err) {
      setActivePopup(null);
    }
  };

  const handleResendVerification = async () => {
    if (resending) return;
    setResending(true);
    try {
      await sendVerificationOtp('EMAIL');
      push('Verification email sent! Check your inbox.', 'success');
      setShowOtp(true);
    } catch (err) {
      push(err.friendlyMessage || err.response?.data?.message || 'Failed to send verification email.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setVerifying(true);
    try {
      const updatedUser = await verifyAccountOtp(otp);
      push('Email verified successfully!', 'success');
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? { ...prev, isVerified: true, verified: true, status: 'VERIFIED' } : prev));
      }
      await refresh();
      setShowOtp(false);
    } catch (err) {
      push(err.friendlyMessage || err.response?.data?.message || 'Invalid verification code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Admin routing restriction: Prevent access to user-side pages
  useEffect(() => {
    if (isAdmin && !location.pathname.startsWith('/app/admin') && location.pathname !== '/app/security') {
      navigate('/app/admin', { replace: true });
    }
    if (!isAdmin && location.pathname.startsWith('/app/admin')) {
      navigate('/app', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface antialiased flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-[4.5rem] z-50 w-7 h-7 rounded-full bg-surface-elevated border border-outline-variant flex items-center justify-center text-muted-tertiary hover:text-on-surface transition-all shadow-md"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute left-0 top-0 bottom-0 w-64 z-50"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} collapsed={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 shrink-0 border-b border-outline-variant bg-surface flex items-center justify-between px-4 sm:px-6 sticky top-0 z-[50]">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-on-surface p-2 -ml-2 rounded-xl hover:bg-surface-variant"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumb locator from reference UI */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-tertiary">
              <span>Dashboards</span>
              <span className="opacity-30">/</span>
              <span className="text-primary font-bold">
                {location.pathname === '/app' ? 'Overview' : location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
              </span>
            </div>
            
            <div className="flex items-center gap-xs ml-md px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="text-[10px] uppercase font-bold text-muted-strong tracking-widest">Desk Status: Stable</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-xs text-secondary bg-surface-elevated hover:bg-surface-variant font-button text-button px-3 py-1.5 rounded-lg border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Live market feed
            </span>
            <NotificationBell />
          </div>
        </header>

        {isUnverified && (
          <div className="bg-carmine/10 border-b border-carmine/20 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-carmine">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Action required:</span> Please verify your email to unlock trading, deposits, and full account access.
              </p>
            </div>
            
            {showOtp ? (
              <form onSubmit={handleVerifyOtp} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-24 rounded-lg border border-carmine/30 bg-carmine/5 px-2.5 py-1.5 text-sm text-carmine placeholder:text-carmine/50 outline-none focus:border-carmine/60"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verifying || otp.length < 4}
                  className="shrink-0 px-4 py-1.5 rounded-lg bg-carmine/20 text-carmine hover:bg-carmine/30 transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {verifying && <Loader2 size={12} className="animate-spin" />}
                  Verify
                </button>
              </form>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="shrink-0 px-4 py-1.5 rounded-lg bg-carmine/20 text-carmine hover:bg-carmine/30 transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {resending && <Loader2 size={12} className="animate-spin" />}
                Send Verification Code
              </button>
            )}
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
      <AgeConfirmation />

      {/* Popup Announcement Modal */}
      <AnimatePresence>
        {activePopup && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-void-800 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle size={24} />
                <h3 className="font-display text-lg font-bold text-ink">Important Announcement</h3>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">
                {activePopup.message}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDismissPopup}
                  className="px-5 py-2.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

