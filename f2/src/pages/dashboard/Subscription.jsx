import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  getCurrentSubscription, 
  upgradeSubscription, 
  upgradeSubscriptionWithWallet,
  cancelSubscription, 
  getSubscriptionHistory, 
  verifyUpgradePayment 
} from '../../api/subscription';
import { getWallet } from '../../api/trading';
import { 
  Sparkles, 
  Shield, 
  Crown, 
  Check, 
  X, 
  Loader2, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  Wallet as WalletIcon,
  Coins
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'PRO' | 'ELITE' | 'CANCEL'
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Payment method selection state
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toISOString().replace('T', ' ').substring(0, 16);
  };

  const loadData = async () => {
    try {
      const [subData, histData, walletData] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionHistory(),
        getWallet().catch(() => null)
      ]);
      setSubscription(subData);
      setHistory(Array.isArray(histData) ? histData : []);
      if (walletData) {
        setWalletBalance(walletData.balance || 0);
      }
    } catch (err) {
      console.error(err);
      push('Failed to load subscription details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if redirecting from Razorpay payment
    const paymentId = searchParams.get('razorpay_payment_id');
    const orderId = searchParams.get('razorpay_payment_link_id');
    const status = searchParams.get('razorpay_payment_link_status');

    if (paymentId && orderId && status === 'paid') {
      setLoading(true);
      verifyUpgradePayment(paymentId, orderId)
        .then((newSub) => {
          setSubscription(newSub);
          push(`Successfully upgraded to ${newSub.plan} plan!`, 'success');
          // Clear query params
          setSearchParams({});
          loadData();
        })
        .catch((err) => {
          push(err.friendlyMessage || 'Payment verification failed.', 'error');
          setSearchParams({});
          loadData();
        });
    } else {
      loadData();
    }
  }, [searchParams]);

  const handleUpgradeClick = (plan) => {
    setSelectedPlanForPayment(plan);
    setPaymentModalOpen(true);
  };

  const handleWalletPay = async () => {
    setActionLoading(selectedPlanForPayment);
    setPaymentModalOpen(false);
    try {
      const updatedSub = await upgradeSubscriptionWithWallet(selectedPlanForPayment);
      setSubscription(updatedSub);
      push(`Successfully upgraded to ${selectedPlanForPayment} using Wallet Balance!`, 'success');
      loadData();
    } catch (err) {
      push(err.friendlyMessage || 'Wallet payment failed. Please make sure you have sufficient balance.', 'error');
    } finally {
      setActionLoading(null);
      setSelectedPlanForPayment(null);
    }
  };

  const handleRazorpayPay = async () => {
    setActionLoading(selectedPlanForPayment);
    setPaymentModalOpen(false);
    try {
      const res = await upgradeSubscription(selectedPlanForPayment);
      if (res?.payment_url) {
        window.location.href = res.payment_url;
      } else {
        push('Failed to initiate upgrade.', 'error');
      }
    } catch (err) {
      push(err.friendlyMessage || 'Upgrade request failed.', 'error');
    } finally {
      setActionLoading(null);
      setSelectedPlanForPayment(null);
    }
  };

  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    setIsCancelModalOpen(false);
    setActionLoading('CANCEL');
    try {
      const updated = await cancelSubscription();
      setSubscription(updated);
      push('Subscription cancelled successfully.', 'success');
      loadData();
    } catch (err) {
      push(err.friendlyMessage || 'Cancellation failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-container" />
      </div>
    );
  }

  const plans = [
    {
      id: 'FREE',
      name: 'CryptoVault Free',
      price: '$0',
      priceInr: '₹0',
      desc: 'Essential features for basic trading and portfolio tracking.',
      icon: Shield,
      iconColor: 'text-muted-strong bg-surface-container-low border border-outline-variant',
      badgeColor: 'bg-surface-container-low text-muted-strong border-outline-variant',
      btnText: 'Current Plan',
      features: [
        'Buy & Sell Cryptocurrency',
        'Portfolio Dashboard',
        'Wallet Management & Transfers',
        '1 Active Watchlist',
        'Live Prices & Basic Trading Charts',
        'AI Chatbot (10 messages/day)',
        'Two-Factor Authentication'
      ],
      negatives: [
        'No Market Replay',
        'No Paper Trading',
        'No Replay Analytics',
        'No Trading Journal',
        'Maximum 3 Price Alerts'
      ]
    },
    {
      id: 'PRO',
      name: 'CryptoVault Pro',
      price: '$10',
      priceInr: '₹850',
      desc: 'Perfect for serious traders looking to practice and refine strategy.',
      icon: Sparkles,
      iconColor: 'text-secondary bg-secondary/10 border border-secondary/20',
      badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
      btnText: 'Upgrade to Pro',
      features: [
        'Everything in Free plan plus:',
        'Unlimited Market Replay',
        'Paper Trading & Replay Portfolio',
        'Save & Resume Replay Sessions',
        'Replay Analytics (Win Rate, ROI, Risk)',
        'Trading Journal',
        'Unlimited AI Chatbot & Trade Analysis',
        'Unlimited Watchlists & Price Alerts',
        'Advanced Portfolio Analytics'
      ],
      negatives: [
        'No AI Strategy Suggestions',
        'No Export Options (CSV/PDF)',
        'No API Access'
      ]
    },
    {
      id: 'ELITE',
      name: 'CryptoVault Elite',
      price: '$50',
      priceInr: '₹4,250',
      desc: 'Full access to institutional-grade analytics and AI-powered reviews.',
      icon: Crown,
      iconColor: 'text-violet-400 bg-violet-400/10 border border-violet-400/20',
      badgeColor: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
      btnText: 'Upgrade to Elite',
      features: [
        'Everything in Pro plan plus:',
        'Equity Curve & Drawdown Analysis',
        'AI Portfolio Review',
        'AI Strategy Suggestions',
        'CSV & PDF Export options',
        'Full Trading Analytics API Access',
        'Priority Customer Support',
        'Early Access to New Features'
      ],
      negatives: []
    }
  ];

  const walletPrice = selectedPlanForPayment === 'PRO' ? 10 : selectedPlanForPayment === 'ELITE' ? 50 : 0;

  return (
    <div className="pb-16 font-hanken">
      <PageHeader
        title="Subscription Plans"
        description="Choose a membership level that fits your trading goals. Upgrade or cancel at any time."
      />

      <div className="px-4 sm:px-8 space-y-8">

      {/* Active Subscription Summary */}
      {subscription && subscription.plan !== 'FREE' && (
        <div className="rounded-lg border border-outline-variant bg-surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-container/10 rounded-md text-primary-container shrink-0 mt-1 border border-outline-variant">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface">Active Plan: {subscription.plan}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  subscription.status === 'CANCELLED' 
                    ? 'bg-error/10 text-error border-error/25'
                    : 'bg-secondary/10 text-secondary border-secondary/25'
                }`}>
                  {subscription.status === 'CANCELLED' ? 'Cancelled (Pending Expiry)' : 'Auto-renewing'}
                </span>
              </div>
              <p className="text-sm text-muted-strong mt-1.5 flex items-center gap-2 font-medium">
                <Calendar size={14} className="text-muted-tertiary" />
                <span>
                  {subscription.status === 'CANCELLED' ? 'Access ends on: ' : 'Next billing date: '}
                  {formatDate(subscription.expiryDate)}
                </span>
              </p>
            </div>
          </div>
          {subscription.status !== 'CANCELLED' && (
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'CANCEL'}
              className="px-5 py-2.5 rounded-md border border-error/30 text-error hover:bg-error/10 transition-all font-button text-sm font-bold disabled:opacity-60"
            >
              {actionLoading === 'CANCEL' ? <Loader2 size={16} className="animate-spin mx-auto text-error" /> : 'Cancel Subscription'}
            </button>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = subscription?.plan === p.id;
          const planTiers = { 'FREE': 0, 'PRO': 1, 'ELITE': 2 };
          const currentPlanTier = planTiers[subscription?.plan || 'FREE'];
          const cardPlanTier = planTiers[p.id];
          const isHigher = currentPlanTier > cardPlanTier;
          const PlanIcon = p.icon;

          return (
            <div 
              key={p.id}
              className={`relative flex flex-col rounded-lg border p-6 bg-surface-card transition-all ${
                isCurrent 
                  ? 'border-secondary/55 shadow-md bg-surface-card' 
                  : 'border-outline-variant hover:border-outline'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-6 bg-secondary text-void text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </div>
              )}

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-md ${p.iconColor}`}>
                  <PlanIcon size={20} />
                </div>
                <h4 className="font-bold text-on-surface text-base">{p.name}</h4>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-on-surface">{p.price}</span>
                  <span className="text-sm text-muted-strong font-medium">/ month</span>
                </div>
                <span className="text-xs text-muted-tertiary font-plex mt-1 block">({p.priceInr} INR / month)</span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-tertiary leading-relaxed mb-6 h-12 font-medium">
                {p.desc}
              </p>

              {isCurrent ? (
                <div className="w-full py-3 rounded-md border border-outline-variant bg-surface-container-low text-center text-muted-strong text-sm font-bold">
                  Current Plan
                </div>
              ) : isHigher || p.id === 'FREE' ? (
                <div className="w-full py-3 rounded-md border border-outline-variant bg-surface-container-low text-center text-muted-strong text-sm font-bold">
                  Included
                </div>
              ) : (
                <button
                  onClick={() => handleUpgradeClick(p.id)}
                  disabled={actionLoading !== null}
                  className={`w-full py-3 rounded-md font-button font-bold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-sm ${
                    p.id === 'ELITE'
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white'
                      : 'bg-primary-container hover:bg-primary-active text-on-primary-container'
                  }`}
                >
                  {actionLoading === p.id ? (
                    <Loader2 size={16} className="animate-spin text-on-primary-container" />
                  ) : (
                    <span>{p.btnText}</span>
                  )}
                </button>
              )}

              {/* Separator */}
              <hr className="border-outline-variant/40 my-6" />

              {/* Features checklist */}
              <div className="flex-1 space-y-3.5 font-medium">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <Check size={14} className="text-secondary shrink-0 mt-0.5" />
                    <span className="text-muted-strong leading-relaxed">{f}</span>
                  </div>
                ))}
                {p.negatives.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs opacity-50">
                    <X size={14} className="text-error shrink-0 mt-0.5" />
                    <span className="text-muted-tertiary leading-relaxed line-through">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Selection Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e11]/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-card shadow-md p-6 font-hanken">
            <h3 className="text-lg font-bold text-on-surface text-center flex items-center justify-center gap-2">
              {selectedPlanForPayment === 'ELITE' ? <Crown className="text-violet-400" size={20} /> : <Sparkles className="text-secondary" size={20} />}
              Upgrade to {selectedPlanForPayment}
            </h3>
            <p className="text-xs text-muted-strong text-center mt-1 font-semibold">
              Select your preferred method to complete payment.
            </p>

            <div className="my-6 space-y-4">
              {/* Option A: Wallet */}
              <button
                onClick={handleWalletPay}
                disabled={walletBalance < walletPrice}
                className={`w-full p-4 rounded-md border text-left flex items-center justify-between transition-all ${
                  walletBalance >= walletPrice
                    ? 'border-outline-variant hover:border-primary-container bg-surface-container-low hover:bg-surface-variant'
                    : 'border-outline-variant/20 opacity-50 cursor-not-allowed bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container-low rounded border border-outline-variant text-muted-strong">
                    <WalletIcon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-on-surface">Pay with Wallet Balance</div>
                    <div className="text-[10px] text-muted-strong mt-0.5 font-plex">Available Balance: ${walletBalance.toFixed(2)} USD</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-plex text-xs font-bold text-secondary">${walletPrice.toFixed(2)} USD</div>
                  {walletBalance < walletPrice && (
                    <div className="text-[8px] text-error font-bold uppercase mt-0.5">Insufficient</div>
                  )}
                </div>
              </button>

              {/* Option B: Razorpay */}
              <button
                onClick={handleRazorpayPay}
                className="w-full p-4 rounded-md border border-outline-variant hover:border-primary-container bg-surface-container-low hover:bg-surface-variant text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container-low rounded border border-outline-variant text-muted-strong">
                    <Coins size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-on-surface">Pay via Cards / UPI / NetBanking</div>
                    <div className="text-[10px] text-muted-strong mt-0.5">Redirects to secure Razorpay checkout</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-plex text-xs font-bold text-secondary">{selectedPlanForPayment === 'PRO' ? '₹850' : '₹4,250'} INR</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-3 font-button">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-md border border-outline-variant text-muted-strong hover:bg-surface-variant text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Ledger History */}
      <div className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
          <h5 className="font-bold text-on-surface text-sm">Billing Ledger & Payments</h5>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-strong">No billing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant text-muted-strong font-bold">
                  <th className="p-4">Date</th>
                  <th className="p-4">Plan Tier</th>
                  <th className="p-4">Reference / Order ID</th>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-variant/20 transition-colors text-muted-tertiary">
                    <td className="p-4 font-plex">
                      {formatDateTime(h.paymentDate)}
                    </td>
                    <td className="p-4 font-bold text-on-surface">{h.plan}</td>
                    <td className="p-4 font-plex text-muted-strong">{h.razorpayOrderId || 'N/A'}</td>
                    <td className="p-4 font-plex text-muted-strong">{h.paymentId || 'N/A'}</td>
                    <td className="p-4 font-bold font-plex text-on-surface">
                      {h.currency === 'USD' ? '$' : '₹'}{h.amount} {h.currency}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded border font-bold font-plex text-[10px] uppercase ${
                        h.status === 'SUCCESS' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : h.status === 'PENDING'
                          ? 'bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/20'
                          : 'bg-error/10 text-error border-error/20'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* Custom Cancel Subscription Confirmation Modal */}
    {isCancelModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e11]/85 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-card shadow-md p-6 font-hanken">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-error/10 border border-error/25 text-error flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-on-surface">
              Cancel Premium Subscription
            </h3>
            <p className="text-xs text-muted-tertiary mt-2 leading-relaxed font-medium">
              Are you sure you want to cancel your premium subscription? You will still retain access to all benefits until the end of your current billing cycle on <span className="font-bold text-on-surface">{formatDate(subscription?.expiryDate)}</span>.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 py-2.5 rounded-md border border-outline-variant text-muted-strong hover:bg-surface-variant text-xs font-bold font-button transition-colors"
            >
              Keep Plan
            </button>
            <button
              onClick={confirmCancel}
              disabled={actionLoading === 'CANCEL'}
              className="flex-1 py-2.5 rounded-md bg-error text-white hover:bg-error/95 text-xs font-bold font-button transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {actionLoading === 'CANCEL' ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                'Yes, Cancel'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
