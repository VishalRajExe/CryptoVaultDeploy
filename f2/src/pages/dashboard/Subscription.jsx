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

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your premium subscription? You will still retain access until the end of your billing cycle.')) {
      return;
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-mint" />
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
      iconColor: 'text-ink-muted bg-white/[0.04]',
      badgeColor: 'bg-white/[0.08] text-ink-muted border-white/10',
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
      iconColor: 'text-mint bg-mint/10',
      badgeColor: 'bg-mint/10 text-mint border-mint/20',
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
      iconColor: 'text-violet-400 bg-violet-400/10',
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
    <div className="space-y-8">
      <PageHeader
        title="Subscription Plans"
        description="Choose a membership level that fits your trading goals. Upgrade or cancel at any time."
      />

      {/* Active Subscription Summary */}
      {subscription && subscription.plan !== 'FREE' && (
        <div className="rounded-2xl border border-white/10 bg-void-900/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-mint/10 rounded-xl text-mint shrink-0 mt-1">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-ink">Active Plan: {subscription.plan}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  subscription.status === 'CANCELLED' 
                    ? 'bg-carmine/10 text-carmine border-carmine/25'
                    : 'bg-mint/10 text-mint border-mint/25'
                }`}>
                  {subscription.status === 'CANCELLED' ? 'Cancelled (Pending Expiry)' : 'Auto-renewing'}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1.5 flex items-center gap-2">
                <Calendar size={14} className="text-ink-faint" />
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
              className="px-5 py-2.5 rounded-xl border border-carmine/30 text-carmine hover:bg-carmine/10 transition-all font-display text-sm font-semibold disabled:opacity-60"
            >
              {actionLoading === 'CANCEL' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Cancel Subscription'}
            </button>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = subscription?.plan === p.id;
          const PlanIcon = p.icon;

          return (
            <div 
              key={p.id}
              className={`relative flex flex-col rounded-3xl border p-6 bg-void-900/60 transition-all ${
                isCurrent 
                  ? 'border-mint/55 shadow-panel bg-void-900/90' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3.5 left-6 bg-mint text-void text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Active
                </div>
              )}

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${p.iconColor}`}>
                  <PlanIcon size={20} />
                </div>
                <h4 className="font-display font-bold text-ink text-base">{p.name}</h4>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-display font-bold text-ink">{p.price}</span>
                  <span className="text-sm text-ink-muted">/ month</span>
                </div>
                <span className="text-xs text-ink-faint font-mono-tab mt-1 block">({p.priceInr} INR / month)</span>
              </div>

              {/* Description */}
              <p className="text-xs text-ink-muted leading-relaxed mb-6 h-12">
                {p.desc}
              </p>

              {/* Action Button */}
              {isCurrent ? (
                <div className="w-full py-3 rounded-xl border border-white/10 bg-white/[0.02] text-center text-ink-muted text-sm font-semibold font-display">
                  Current Plan
                </div>
              ) : p.id === 'FREE' ? (
                <div className="w-full py-3 rounded-xl border border-white/10 bg-white/[0.02] text-center text-ink-muted text-sm font-semibold font-display">
                  Included
                </div>
              ) : (
                <button
                  onClick={() => handleUpgradeClick(p.id)}
                  disabled={actionLoading !== null}
                  className={`w-full py-3 rounded-xl font-display font-semibold text-sm transition-all text-center flex items-center justify-center gap-2 ${
                    p.id === 'ELITE'
                      ? 'bg-gradient-to-r from-violet to-fuchsia hover:from-violet-400 hover:to-fuchsia-400 text-white shadow-lg shadow-violet/10'
                      : 'bg-mint hover:bg-mint-400 text-void shadow-lg shadow-mint/10'
                  }`}
                >
                  {actionLoading === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>{p.btnText}</span>
                  )}
                </button>
              )}

              {/* Separator */}
              <hr className="border-white/[0.06] my-6" />

              {/* Features checklist */}
              <div className="flex-1 space-y-3.5">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <Check size={14} className="text-mint shrink-0 mt-0.5" />
                    <span className="text-ink-muted leading-relaxed">{f}</span>
                  </div>
                ))}
                {p.negatives.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs opacity-50">
                    <X size={14} className="text-carmine shrink-0 mt-0.5" />
                    <span className="text-ink-faint leading-relaxed line-through">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Selection Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-void-900 shadow-panel p-6">
            <h3 className="font-display text-lg font-bold text-ink text-center flex items-center justify-center gap-2">
              {selectedPlanForPayment === 'ELITE' ? <Crown className="text-violet-400" size={20} /> : <Sparkles className="text-mint" size={20} />}
              Upgrade to {selectedPlanForPayment}
            </h3>
            <p className="text-xs text-ink-muted text-center mt-1">
              Select your preferred method to complete payment.
            </p>

            <div className="my-6 space-y-4">
              {/* Option A: Wallet */}
              <button
                onClick={handleWalletPay}
                disabled={walletBalance < walletPrice}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  walletBalance >= walletPrice
                    ? 'border-white/10 hover:border-mint/45 bg-white/[0.02] hover:bg-white/[0.04]'
                    : 'border-white/5 opacity-50 cursor-not-allowed bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-ink-muted">
                    <WalletIcon size={18} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm text-ink">Pay with Wallet Balance</div>
                    <div className="text-[10px] text-ink-faint mt-0.5">Available Balance: ${walletBalance.toFixed(2)} USD</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-mint">${walletPrice.toFixed(2)} USD</div>
                  {walletBalance < walletPrice && (
                    <div className="text-[8px] text-carmine font-semibold uppercase mt-0.5">Insufficient</div>
                  )}
                </div>
              </button>

              {/* Option B: Razorpay */}
              <button
                onClick={handleRazorpayPay}
                className="w-full p-4 rounded-xl border border-white/10 hover:border-mint/45 bg-white/[0.02] hover:bg-white/[0.04] text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-ink-muted">
                    <Coins size={18} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm text-ink">Pay via Cards / UPI / NetBanking</div>
                    <div className="text-[10px] text-ink-faint mt-0.5">Redirects to secure Razorpay checkout</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-mint">{selectedPlanForPayment === 'PRO' ? '₹850' : '₹4,250'} INR</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-ink-muted hover:bg-white/[0.04] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Ledger History */}
      <div className="rounded-2xl border border-white/10 bg-void-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h5 className="font-display font-semibold text-ink text-sm">Billing Ledger & Payments</h5>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-faint">No billing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.04] text-ink-muted font-medium">
                  <th className="p-4">Date</th>
                  <th className="p-4">Plan Tier</th>
                  <th className="p-4">Reference / Order ID</th>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-white/[0.01] transition-colors text-ink-muted">
                    <td className="p-4 font-mono-tab">
                      {formatDateTime(h.paymentDate)}
                    </td>
                    <td className="p-4 font-semibold text-ink">{h.plan}</td>
                    <td className="p-4 font-mono-tab text-ink-faint">{h.razorpayOrderId || 'N/A'}</td>
                    <td className="p-4 font-mono-tab text-ink-faint">{h.paymentId || 'N/A'}</td>
                    <td className="p-4 font-semibold font-mono-tab text-ink">
                      {h.currency === 'USD' ? '$' : '₹'}{h.amount} {h.currency}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${
                        h.status === 'SUCCESS' 
                          ? 'bg-mint/10 text-mint border-mint/20'
                          : h.status === 'PENDING'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          : 'bg-carmine/10 text-carmine border-carmine/20'
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
  );
}
