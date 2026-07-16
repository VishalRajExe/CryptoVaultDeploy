import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { 
  adminGetAllSubscriptions, 
  adminExtendSubscription, 
  adminCancelSubscription,
  getSubscriptionHistory
} from '../../api/subscription';
import { 
  Loader2, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Calendar,
  AlertTriangle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelSubscriptionId, setCancelSubscriptionId] = useState(null);
  const { push } = useToast();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toISOString().split('T')[0];
  };

  const loadData = async () => {
    try {
      const data = await adminGetAllSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
      
      // Load all billing logs
      const historyData = await getSubscriptionHistory(); 
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error(err);
      push('Failed to load admin subscription statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExtend = async (id, days) => {
    setActionLoading(id);
    try {
      await adminExtendSubscription(id, days);
      push(`Extended subscription by ${days} days.`, 'success');
      loadData();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to extend subscription.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = (id) => {
    setCancelSubscriptionId(id);
  };

  const confirmCancel = async () => {
    if (!cancelSubscriptionId) return;
    const id = cancelSubscriptionId;
    setCancelSubscriptionId(null);
    setActionLoading(id);
    try {
      await adminCancelSubscription(id);
      push('Subscription force cancelled successfully.', 'success');
      loadData();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to cancel subscription.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-surface-container-lowest">
        <Loader2 className="h-8 w-8 animate-spin text-primary-container" />
      </div>
    );
  }

  // Calculate statistics
  const activeSubs = subscriptions.filter(s => s.active && s.plan !== 'FREE');
  const totalRevenue = activeSubs.reduce((acc, curr) => {
    let amt = curr.amount || 0;
    if (curr.currency === 'USD') {
      amt = amt * 85;
    }
    return acc + amt;
  }, 0);
  const activeUserCount = activeSubs.length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length;

  return (
    <div className="space-y-8 font-hanken">
      <PageHeader
        title="Subscription Management"
        description="View revenue statistics, active user tiers, extend plans, or cancel active memberships."
      />

      {/* Admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-strong uppercase font-bold font-plex">Active Memberships</span>
            <Users size={16} className="text-primary-container" />
          </div>
          <div className="text-2xl font-bold font-hanken text-on-surface mt-2">{activeUserCount}</div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-strong uppercase font-bold font-plex">Monthly Recurring Revenue</span>
            <DollarSign size={16} className="text-primary-container" />
          </div>
          <div className="text-2xl font-bold font-hanken text-on-surface mt-2">₹{totalRevenue} <span className="text-xs text-muted-strong font-plex font-bold">INR</span></div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-strong uppercase font-bold font-plex">Expired Subscriptions</span>
            <Clock size={16} className="text-error" />
          </div>
          <div className="text-2xl font-bold font-hanken text-on-surface mt-2">{expiredCount}</div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-strong uppercase font-bold font-plex">Status checks</span>
            <ShieldCheck size={16} className="text-secondary" />
          </div>
          <div className="text-2xl font-bold font-hanken text-secondary mt-2">Stable</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <h5 className="font-hanken font-bold text-on-surface text-sm">Active Memberships List</h5>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-strong font-bold">No subscriptions found in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-muted-strong font-plex font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Monthly Rate</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-variant/20 transition-colors text-muted-strong">
                    <td className="p-4">
                      <div className="font-bold text-on-surface">{s.user?.fullName || 'Anonymous'}</div>
                      <div className="text-[10px] text-muted-strong font-plex font-semibold">{s.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded font-bold border text-[10px] font-plex ${
                        s.plan === 'ELITE' 
                          ? 'bg-primary-container/10 text-primary-container border-primary-container/20'
                          : s.plan === 'PRO'
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : 'bg-surface-container-low text-muted-strong border-outline-variant'
                      }`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="p-4 font-plex font-bold text-on-surface">
                      ₹{s.currency === 'USD' ? (s.amount * 85) : (s.amount || 0)}
                    </td>
                    <td className="p-4 font-plex font-semibold text-muted-tertiary">
                      {formatDate(s.startDate)}
                    </td>
                    <td className="p-4 font-plex font-semibold text-muted-tertiary">
                      {formatDate(s.expiryDate)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border font-plex ${
                        s.status === 'ACTIVE' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : s.status === 'CANCELLED'
                          ? 'bg-outline-variant/10 text-muted-strong border-outline-variant/30'
                          : 'bg-error/10 text-error border-error/20'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {s.plan !== 'FREE' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleExtend(s.id, 30)}
                            disabled={actionLoading === s.id}
                            className="px-2.5 py-1 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-variant rounded font-bold font-button text-[10px] transition-colors shadow-sm"
                          >
                            +30 Days
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={actionLoading === s.id}
                            className="px-2.5 py-1 bg-error/10 border border-error/20 text-error hover:bg-error/20 rounded font-bold font-button text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Admin Cancel Confirmation Modal */}
      {cancelSubscriptionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e11]/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-card p-6 font-hanken">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 border border-error/25 text-error flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-on-surface">
                Force Cancel Subscription
              </h3>
              <p className="text-xs text-muted-tertiary mt-2 leading-relaxed font-medium">
                Are you sure you want to force cancel this subscription immediately? This will revert the user to the <span className="font-bold text-secondary">FREE</span> plan immediately and log a cancellation record.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCancelSubscriptionId(null)}
                className="flex-1 py-2.5 rounded border border-outline-variant text-muted-strong hover:bg-surface-variant text-xs font-bold font-button transition-colors"
              >
                Keep Active
              </button>
              <button
                onClick={confirmCancel}
                disabled={actionLoading === cancelSubscriptionId}
                className="flex-1 py-2.5 rounded bg-error text-white hover:bg-error/90 text-xs font-bold font-button transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {actionLoading === cancelSubscriptionId ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  'Force Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
