import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wallet as WalletIcon,
  Brain,
  Monitor,
  Smartphone,
  Trash2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Check,
  Loader2,
  Calendar,
  Camera,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import PageTransition from '../../components/PageTransition';
import {
  getWallet,
  getUserAssets,
  getAllOrders,
  getPaymentDetails,
  addPaymentDetails,
} from '../../api/trading';
import {
  sendVerificationOtp,
  verifyAccountOtp,
} from '../../api/auth';
import {
  updateProfile,
  changePassword,
  submitKyc,
  approveKyc,
  getAllSessions,
  getAiChatUsage,
} from '../../api/profile';
import { getCurrentSubscription } from '../../api/subscription';

const FADE_IN = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Profile() {
  const { user, refresh } = useAuth();
  const { push } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'verification'

  // Data State
  const [wallet, setWallet] = useState(null);
  const [assets, setAssets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [chatUsage, setChatUsage] = useState({ messageCount: 0 });
  const [bankDetails, setBankDetails] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);

  // Form Fields
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    mobile: '',
    picture: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [kycForm, setKycForm] = useState({
    documentType: 'PASSPORT',
    documentNumber: '',
  });

  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    accountHolderName: '',
    ifsc: '',
    bankName: '',
  });

  const [phoneOtp, setPhoneOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfileData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [
        walletData,
        assetsData,
        ordersData,
        sessionsData,
        chatUsageData,
        bankData,
        subData,
      ] = await Promise.all([
        getWallet().catch(() => null),
        getUserAssets().catch(() => []),
        getAllOrders().catch(() => []),
        getAllSessions().catch(() => []),
        getAiChatUsage().catch(() => ({ messageCount: 0 })),
        getPaymentDetails().catch(() => null),
        getCurrentSubscription().catch(() => null),
      ]);

      setWallet(walletData);
      setAssets(assetsData);
      setOrders(ordersData);
      setSessions(sessionsData);
      setChatUsage(chatUsageData);
      setBankDetails(bankData);
      setSubscription(subData);

      if (user) {
        setProfileForm({
          fullName: user.fullName || '',
          username: user.username || '',
          mobile: user.mobile || '',
          picture: user.picture || '',
        });
      }
    } catch (err) {
      console.error(err);
      push('Failed to load profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  // Form Submit Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateProfile({
        fullName: profileForm.fullName,
        username: profileForm.username,
        mobile: profileForm.mobile,
        picture: profileForm.picture,
      });
      push('Profile updated successfully!', 'success');
      await refresh();
      setEditProfileOpen(false);
    } catch (err) {
      push(err.response?.data?.message || err.friendlyMessage || 'Failed to update profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      push('New passwords do not match.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      push('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordOpen(false);
    } catch (err) {
      push(err.response?.data?.message || err.friendlyMessage || 'Incorrect current password or invalid new password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setSubmitting(true);
    try {
      await sendVerificationOtp('MOBILE');
      push('Phone verification OTP sent!', 'success');
      setPhoneVerifyOpen(true);
    } catch (err) {
      push(err.friendlyMessage || 'Failed to send OTP.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyAccountOtp(phoneOtp);
      push('Phone number verified successfully!', 'success');
      setPhoneVerifyOpen(false);
      setPhoneOtp('');
      await refresh();
      await fetchProfileData(true);
    } catch (err) {
      push(err.friendlyMessage || 'Invalid OTP. Please check and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitKyc(kycForm.documentType, kycForm.documentNumber);
      push('KYC documents submitted. Verifying...', 'info');
      setKycOpen(false);
      await refresh();
      
      // Auto-approve after 4 seconds to make experience satisfying
      setTimeout(async () => {
        try {
          await approveKyc();
          push('KYC status verification completed. Approved!', 'success');
          await refresh();
          await fetchProfileData(true);
        } catch (err) {
          console.error(err);
        }
      }, 4000);
    } catch (err) {
      push(err.friendlyMessage || 'Failed to submit KYC.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addPaymentDetails(bankForm);
      push('Bank account linked successfully!', 'success');
      setBankOpen(false);
      await fetchProfileData(true);
    } catch (err) {
      push(err.friendlyMessage || 'Failed to link bank account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Revoke device session
  const handleRevokeSession = async (id) => {
    try {
      const { revokeSession } = await import('../../api/sessions');
      await revokeSession(id);
      push('Session revoked.', 'success');
      await fetchProfileData(true);
    } catch (err) {
      push('Failed to revoke session.', 'error');
    }
  };

  // Calculations
  const unrealizedPL = useMemo(() => {
    return assets.reduce((sum, a) => {
      const price = a.coin?.currentPrice || 0;
      return sum + (a.quantity || 0) * (price - (a.buyPrice || 0));
    }, 0);
  }, [assets]);

  const btcRate = 91250; // Mock BTC conversion rate
  const btcBalance = wallet?.balance ? (wallet.balance / btcRate).toFixed(6) : '0.000000';

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-container" />
      </div>
    );
  }

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <PageTransition className="pb-16 font-hanken text-on-surface">
      <PageHeader
        eyebrow="Account Hub"
        title="User Profile & Settings"
        description="Configure your personal settings, security, and verification details."
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-surface-container-low border border-outline-variant rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Account Overview', icon: UserIcon },
            { id: 'timeline', label: 'Activity Timeline', icon: Activity },
            { id: 'verification', label: 'Verification & Bank', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-muted-strong hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={FADE_IN}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left & Middle Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Information Header Card */}
                <div className="rounded-xl border border-outline-variant bg-surface-card p-6 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.005] rounded-full blur-3xl" />
                  
                  {/* Photo Section */}
                  <div className="relative group/avatar">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-high border-2 border-outline-variant/60 flex items-center justify-center font-display text-2xl font-bold text-primary-container">
                      {user?.picture ? (
                        <img src={user.picture} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <button
                      onClick={() => setEditProfileOpen(true)}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-container hover:bg-primary-active text-on-primary-container flex items-center justify-center shadow-lg border border-surface-card transition-colors"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  {/* Core details */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <h2 className="text-xl font-bold text-on-surface">{user?.fullName}</h2>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-primary-container/10 border border-primary-container/20 text-primary-container px-2 py-0.5 rounded">
                        {subscription?.plan || 'Free'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-tertiary font-mono">
                      {user?.username || '@trader_profile'} • Joined {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recently'}
                    </p>
                    
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted-strong font-medium">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Mail size={12} className="text-muted-tertiary" />
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Phone size={12} className="text-muted-tertiary" />
                        <span>{user?.mobile || 'Not Linked'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setProfileForm({
                        fullName: user?.fullName || '',
                        username: user?.username || '',
                        mobile: user?.mobile || '',
                        picture: user?.picture || '',
                      });
                      setEditProfileOpen(true);
                    }}
                    className="shrink-0 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-xs font-bold text-on-surface transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* row with balance and performance cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Summary */}
                  <div className="rounded-xl border border-outline-variant bg-surface-card p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-muted-strong uppercase tracking-wider font-bold">Total Wallet Balance</span>
                        <WalletIcon size={16} className="text-muted-tertiary" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-display font-bold text-on-surface">
                          ${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-xs text-muted-tertiary font-mono">
                          ≈ {btcBalance} BTC
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-outline-variant/30">
                      <a
                        href="/app/wallet"
                        className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold text-center hover:bg-primary-active transition-colors shadow-sm"
                      >
                        Deposit
                      </a>
                      <a
                        href="/app/wallet"
                        className="flex-1 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-xs font-bold text-center text-on-surface transition-colors"
                      >
                        Withdraw
                      </a>
                    </div>
                  </div>

                  {/* Performance stats */}
                  <div className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-strong uppercase tracking-wider font-bold">Trading Statistics</span>
                      <TrendingUp size={16} className="text-muted-tertiary" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-muted-tertiary uppercase font-bold tracking-wider mb-0.5">Unrealized P/L</div>
                        <div className={`text-base font-bold font-mono ${unrealizedPL >= 0 ? 'text-secondary' : 'text-error'}`}>
                          {unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-tertiary uppercase font-bold tracking-wider mb-0.5">Total Trades</div>
                        <div className="text-base font-bold text-on-surface font-mono">{orders.length}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
                      <div className="flex justify-between text-xs font-medium text-muted-strong">
                        <span className="flex items-center gap-1"><Brain size={12} /> AI Daily Limits</span>
                        <span>{chatUsage.messageCount} / {subscription?.plan === 'FREE' || !subscription ? '10' : 'Unlimited'}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full bg-primary-container transition-all"
                          style={{ width: `${subscription?.plan === 'FREE' || !subscription ? Math.min((chatUsage.messageCount / 10) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Center Card */}
                <div className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="text-primary-container" size={18} />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">Security Center</h3>
                    </div>
                    <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary font-bold px-2 py-0.5 rounded">SYSTEM SECURE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Security controls */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                        <div>
                          <div className="text-xs font-bold text-on-surface">Two-Factor Authentication</div>
                          <div className="text-[10px] text-muted-tertiary mt-0.5">
                            {user?.twoFactorAuth?.enabled ? 'Authenticator active' : 'Disabled (High Risk)'}
                          </div>
                        </div>
                        <a
                          href="/app/security"
                          className="text-xs font-bold text-primary-container hover:text-primary-active transition-colors shrink-0"
                        >
                          Manage
                        </a>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                        <div>
                          <div className="text-xs font-bold text-on-surface">Login Password</div>
                          <div className="text-[10px] text-muted-tertiary mt-0.5">Keep your account secure by rotating credentials</div>
                        </div>
                        <button
                          onClick={() => setChangePasswordOpen(true)}
                          className="text-xs font-bold text-primary-container hover:text-primary-active transition-colors shrink-0"
                        >
                          Update
                        </button>
                      </div>
                    </div>

                    {/* Quick Session List */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-muted-strong uppercase tracking-wider">Recent Login Activity</div>
                      {sessions.length === 0 ? (
                        <div className="text-xs text-muted-tertiary">No logins found.</div>
                      ) : (
                        <div className="space-y-2">
                          {sessions.slice(0, 3).map((s) => (
                            <div key={s.id} className="flex justify-between items-center text-xs p-2 rounded bg-surface-container-high/40">
                              <div className="flex items-center gap-2">
                                {s.deviceType === 'iOS' || s.deviceType === 'Android' ? (
                                  <Smartphone size={12} className="text-muted-tertiary" />
                                ) : (
                                  <Monitor size={12} className="text-muted-tertiary" />
                                )}
                                <span className="font-medium text-on-surface">{s.deviceType || 'Web Browser'}</span>
                              </div>
                              <span className="text-[10px] text-muted-tertiary font-mono">{s.ipAddress}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Verification Status Card */}
                <div className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-strong">Verification Status</h3>
                  
                  <div className="space-y-4">
                    {/* Email Verification */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.verified || user?.isVerified ? 'bg-secondary/10 text-secondary' : 'bg-carmine/10 text-carmine'}`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xs font-semibold text-on-surface">Email Address</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user?.verified || user?.isVerified ? 'bg-secondary/10 text-secondary' : 'bg-carmine/10 text-carmine'}`}>
                        {user?.verified || user?.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>

                    {/* Phone Verification */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.mobileVerified ? 'bg-secondary/10 text-secondary' : 'bg-carmine/10 text-carmine'}`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xs font-semibold text-on-surface">Phone Number</span>
                      </div>
                      {user?.mobileVerified ? (
                        <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">VERIFIED</span>
                      ) : (
                        <button
                          onClick={handleSendPhoneOtp}
                          className="text-[10px] font-bold bg-carmine/10 text-carmine hover:bg-carmine/20 px-2 py-0.5 rounded transition-colors"
                        >
                          VERIFY
                        </button>
                      )}
                    </div>

                    {/* KYC Verification */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.kycStatus === 'APPROVED' ? 'bg-secondary/10 text-secondary' : user?.kycStatus === 'PENDING' ? 'bg-amber-400/10 text-amber-400' : 'bg-carmine/10 text-carmine'}`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xs font-semibold text-on-surface">KYC Identity</span>
                      </div>
                      {user?.kycStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">VERIFIED</span>
                      ) : user?.kycStatus === 'PENDING' ? (
                        <span className="text-[10px] font-bold bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">PENDING</span>
                      ) : (
                        <button
                          onClick={() => setKycOpen(true)}
                          className="text-[10px] font-bold bg-carmine/10 text-carmine hover:bg-carmine/20 px-2 py-0.5 rounded transition-colors"
                        >
                          VERIFY
                        </button>
                      )}
                    </div>

                    {/* Bank account details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bankDetails ? 'bg-secondary/10 text-secondary' : 'bg-carmine/10 text-carmine'}`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xs font-semibold text-on-surface">Bank Details</span>
                      </div>
                      {bankDetails ? (
                        <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">CONNECTED</span>
                      ) : (
                        <button
                          onClick={() => setBankOpen(true)}
                          className="text-[10px] font-bold bg-carmine/10 text-carmine hover:bg-carmine/20 px-2 py-0.5 rounded transition-colors"
                        >
                          CONNECT
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-tertiary leading-relaxed">
                    Complete all verification tiers to unlock a maximum daily withdrawal limit of <span className="font-bold text-on-surface">$1,000,000.00</span>.
                  </p>
                </div>

                {/* Membership Upgrade */}
                <div className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/[0.03] rounded-full blur-xl group-hover:scale-110 transition-all" />
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-muted-strong uppercase font-bold tracking-wider">Membership Program</div>
                      <h4 className="text-lg font-bold text-primary-container">{subscription?.plan ? `${subscription.plan} Member` : 'Free Tier'}</h4>
                    </div>
                    <CreditCard size={32} className="text-primary-container" />
                  </div>

                  <p className="text-xs text-muted-strong leading-relaxed">
                    VIP-1 benefits include ultra-low maker/taker fee tiers (0.02% / 0.04%), priority customer desks, and unlocked high speed API trade bots.
                  </p>

                  <a
                    href="/app/subscription"
                    className="w-full flex justify-center py-2.5 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold transition-colors"
                  >
                    Upgrade Plan
                  </a>
                </div>

                {/* Authorized Devices list */}
                <div className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-strong">Authorized Devices</h3>
                  
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-3 rounded bg-surface-container-low border border-outline-variant/40">
                        <div className="flex items-center gap-3">
                          {s.deviceType === 'iOS' || s.deviceType === 'Android' ? (
                            <Smartphone size={16} className="text-muted-tertiary" />
                          ) : (
                            <Monitor size={16} className="text-muted-tertiary" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-on-surface">
                              {s.deviceType || 'Web Browser'} {s.current && <span className="text-[9px] text-secondary font-bold ml-1">(Current)</span>}
                            </div>
                            <div className="text-[10px] text-muted-tertiary font-mono">{s.ipAddress}</div>
                          </div>
                        </div>

                        {!s.current && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="p-1 text-muted-tertiary hover:text-error hover:bg-error-container/10 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={FADE_IN}
              className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="text-primary-container" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">Activity Timeline</h3>
                </div>
                <span className="text-xs text-muted-tertiary">Real-time audit log of account movements</span>
              </div>

              {/* Real Timeline */}
              <ActivityLogTimeline />
            </motion.div>
          )}

          {activeTab === 'verification' && (
            <motion.div
              key="verification"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={FADE_IN}
              className="rounded-xl border border-outline-variant bg-surface-card p-6 space-y-8 max-w-4xl mx-auto"
            >
              {/* KYC identity panel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-on-surface">
                  <FileCheck className="text-primary-container" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">KYC Document Verification</h3>
                </div>
                <p className="text-xs text-muted-strong leading-relaxed max-w-2xl">
                  Under global financial compliance, you are required to verify your identification before making larger cryptocurrency withdraw requests.
                </p>

                <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Verification Status</div>
                    <div className="text-[10px] text-muted-tertiary mt-0.5">
                      {user?.kycStatus === 'APPROVED' ? 'Approved (Access granted)' : user?.kycStatus === 'PENDING' ? 'Under Review (24-48h)' : 'Not verified'}
                    </div>
                  </div>
                  {user?.kycStatus === 'APPROVED' ? (
                    <span className="text-xs font-bold text-secondary flex items-center gap-1"><Check size={14} /> Approved</span>
                  ) : user?.kycStatus === 'PENDING' ? (
                    <span className="text-xs font-bold text-amber-400">Pending Review</span>
                  ) : (
                    <button
                      onClick={() => setKycOpen(true)}
                      className="px-4 py-2 bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold rounded transition-colors"
                    >
                      Submit Verification Documents
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Details section */}
              <div className="space-y-4 pt-6 border-t border-outline-variant/30">
                <div className="flex items-center gap-2.5 text-on-surface">
                  <Building className="text-primary-container" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Linked Bank Accounts</h3>
                </div>
                <p className="text-xs text-muted-strong leading-relaxed max-w-2xl">
                  Connect your bank details to execute fiat withdrawals instantly. Ensure bank credentials match your registered Full Name.
                </p>

                {bankDetails ? (
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-on-surface">{bankDetails.bankName || 'Linked Bank'}</div>
                      <div className="text-[10px] text-muted-tertiary mt-0.5">
                        Account: ****{bankDetails.accountNumber?.slice(-4) || 'XXXX'} • Holder: {bankDetails.accountHolderName}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBankForm({
                          accountNumber: bankDetails.accountNumber || '',
                          accountHolderName: bankDetails.accountHolderName || '',
                          ifsc: bankDetails.ifsc || '',
                          bankName: bankDetails.bankName || '',
                        });
                        setBankOpen(true);
                      }}
                      className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-xs font-bold rounded transition-colors"
                    >
                      Manage Account
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg bg-surface-container-low/40 border border-dashed border-outline-variant flex flex-col items-center justify-center text-center space-y-3">
                    <Building size={32} className="text-muted-tertiary" />
                    <div>
                      <div className="text-xs font-bold text-on-surface">No linked bank accounts</div>
                      <div className="text-[10px] text-muted-tertiary mt-0.5">Add bank accounts details to proceed with withdrawals.</div>
                    </div>
                    <button
                      onClick={() => setBankOpen(true)}
                      className="px-4 py-2 bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold rounded transition-colors"
                    >
                      Link Bank Account
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <Dialog modalOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Profile Details">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              placeholder="@alexander_sterling"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Phone Number</label>
            <input
              type="text"
              value={profileForm.mobile}
              onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
              placeholder="+1 (888) 293-1029"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Profile Photo URL</label>
            <input
              type="text"
              value={profileForm.picture}
              onChange={(e) => setProfileForm({ ...profileForm, picture: e.target.value })}
              placeholder="https://images.unsplash.com/photo-X"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
            />
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setEditProfileOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog modalOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} title="Change Account Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setChangePasswordOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </Dialog>

      {/* KYC Upload Modal */}
      <Dialog modalOpen={kycOpen} onClose={() => setKycOpen(false)} title="Verify Identity (KYC)">
        <form onSubmit={handleSubmitKyc} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Document Type</label>
            <select
              value={kycForm.documentType}
              onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary-container"
            >
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID / Driver License</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Document Number</label>
            <input
              type="text"
              value={kycForm.documentNumber}
              onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
              placeholder="e.g. F928137"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>

          <p className="text-[10px] text-muted-tertiary">
            Identity validation requires up to 48 hours for auditing. Simulating instant verification for sandbox environments.
          </p>

          <div className="flex gap-3 pt-4 justify-end border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setKycOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Submit Documents
            </button>
          </div>
        </form>
      </Dialog>

      {/* Link Bank Modal */}
      <Dialog modalOpen={bankOpen} onClose={() => setBankOpen(false)} title="Link Bank Account details">
        <form onSubmit={handleSaveBankDetails} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Bank Name</label>
            <input
              type="text"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              placeholder="Chase, HDFC, Wells Fargo"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Account Number</label>
            <input
              type="text"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              placeholder="100234091"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Account Holder Name</label>
            <input
              type="text"
              value={bankForm.accountHolderName}
              onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
              placeholder="Alexander Sterling"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">IFSC / Swift code</label>
            <input
              type="text"
              value={bankForm.ifsc}
              onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
              placeholder="e.g. CHASUS33"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setBankOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Connect Account
            </button>
          </div>
        </form>
      </Dialog>

      {/* Phone OTP Verification Modal */}
      <Dialog modalOpen={phoneVerifyOpen} onClose={() => setPhoneVerifyOpen(false)} title="Verify Phone number">
        <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
          <p className="text-xs text-muted-strong">
            We sent a verification OTP code to your registered mobile number <span className="font-bold text-on-surface">{user?.mobile}</span>. Enter code below to verify.
          </p>
          <div>
            <label className="block text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-1.5">Verification Code</label>
            <input
              type="text"
              maxLength={6}
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-widest font-mono rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-lg text-on-surface outline-none focus:border-primary-container"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setPhoneVerifyOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || phoneOtp.length < 4}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary-active text-on-primary-container text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Verify Code
            </button>
          </div>
        </form>
      </Dialog>
    </PageTransition>
  );
}

// Reusable Dialog Modal component
function Dialog({ modalOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-surface-card border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-4 text-on-surface"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary-container">{title}</h3>
              <button onClick={onClose} className="text-muted-tertiary hover:text-on-surface transition-colors p-1">
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Activity timeline list subcomponent
function ActivityLogTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const { getNotificationHistory } = await import('../../api/auth');
        const list = await getNotificationHistory();
        setTimeline(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTimeline();
  }, []);

  if (loading) {
    return <div className="text-xs text-muted-tertiary py-6 text-center">Loading audit timeline...</div>;
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-10 space-y-2 border border-dashed border-outline-variant/50 rounded-lg">
        <Activity className="mx-auto text-muted-tertiary" size={24} />
        <div className="text-xs font-bold text-on-surface">No audit logs found</div>
        <div className="text-[10px] text-muted-tertiary">All transactions, updates and security logins show up here.</div>
      </div>
    );
  }

  const getTimelineIcon = (type) => {
    switch (type) {
      case 'WALLET':
        return { icon: WalletIcon, color: 'bg-primary-container/10 border border-primary-container/20 text-primary-container' };
      case 'SECURITY':
      case 'AUTHENTICATION':
        return { icon: Shield, color: 'bg-carmine/10 border border-carmine/20 text-carmine' };
      case 'TRADING':
        return { icon: TrendingUp, color: 'bg-secondary/10 border border-secondary/20 text-secondary' };
      default:
        return { icon: Activity, color: 'bg-surface-container-high border border-outline-variant/60 text-muted-strong' };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
      {timeline.map((item) => {
        const style = getTimelineIcon(item.notificationType);
        const Icon = style.icon;
        const formattedDate = new Date(item.timestamp).toLocaleString();
        
        return (
          <div key={item.id} className="relative flex gap-4 items-start">
            {/* Dot/Icon */}
            <div className={`absolute -left-6 w-5.5 h-5.5 rounded-full flex items-center justify-center -translate-x-0.5 z-10 ${style.color}`}>
              <Icon size={10} />
            </div>

            {/* Content card */}
            <div className="flex-1 p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 space-y-1">
              <div className="flex justify-between items-start gap-4">
                <div className="text-xs font-bold text-on-surface" dangerouslySetInnerHTML={{ __html: item.subject }} />
                <span className="text-[9px] text-muted-tertiary whitespace-nowrap font-mono">{formattedDate}</span>
              </div>
              <div className="text-[10px] text-muted-tertiary">
                Channel: {item.recipient} • Status: <span className={item.status === 'SUCCESS' ? 'text-secondary font-bold' : 'text-error'}>{item.status}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
