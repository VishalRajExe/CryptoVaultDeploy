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

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to force cancel this subscription immediately? This will revert the user to the FREE plan.')) {
      return;
    }
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mint" />
      </div>
    );
  }

  // Calculate statistics
  const activeSubs = subscriptions.filter(s => s.active && s.plan !== 'FREE');
  const totalRevenue = activeSubs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const activeUserCount = activeSubs.length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription Management"
        description="View revenue statistics, active user tiers, extend plans, or cancel active memberships."
      />

      {/* Admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-white/10 bg-void-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted uppercase font-semibold">Active Memberships</span>
            <Users size={16} className="text-mint" />
          </div>
          <div className="text-2xl font-bold font-display text-ink mt-2">{activeUserCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-void-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted uppercase font-semibold">Monthly Recurring Revenue</span>
            <DollarSign size={16} className="text-mint" />
          </div>
          <div className="text-2xl font-bold font-display text-ink mt-2">₹{totalRevenue} <span className="text-xs text-ink-faint">INR</span></div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-void-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted uppercase font-semibold">Expired Subscriptions</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-display text-ink mt-2">{expiredCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-void-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted uppercase font-semibold">Status checks</span>
            <ShieldCheck size={16} className="text-mint" />
          </div>
          <div className="text-2xl font-bold font-display text-ink mt-2">Stable</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl border border-white/10 bg-void-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h5 className="font-display font-semibold text-ink text-sm">Active Memberships List</h5>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-faint">No subscriptions found in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.04] text-ink-muted font-medium">
                  <th className="p-4">User</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Monthly Rate</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-colors text-ink-muted">
                    <td className="p-4">
                      <div className="font-semibold text-ink">{s.user?.fullName || 'Anonymous'}</div>
                      <div className="text-[10px] text-ink-faint">{s.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                        s.plan === 'ELITE' 
                          ? 'bg-violet-400/10 text-violet-400 border-violet-400/20'
                          : s.plan === 'PRO'
                          ? 'bg-mint/10 text-mint border-mint/20'
                          : 'bg-white/5 text-ink-muted border-white/10'
                      }`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="p-4 font-mono-tab">₹{s.amount || 0}</td>
                    <td className="p-4 font-mono-tab">
                      {formatDate(s.startDate)}
                    </td>
                    <td className="p-4 font-mono-tab">
                      {formatDate(s.expiryDate)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${
                        s.status === 'ACTIVE' 
                          ? 'bg-mint/10 text-mint border-mint/20'
                          : s.status === 'CANCELLED'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          : 'bg-carmine/10 text-carmine border-carmine/20'
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
                            className="px-2.5 py-1 bg-white/[0.04] border border-white/10 text-ink hover:bg-white/[0.1] rounded font-semibold text-[10px] transition-colors"
                          >
                            +30 Days
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={actionLoading === s.id}
                            className="px-2.5 py-1 bg-carmine/10 border border-carmine/20 text-carmine hover:bg-carmine/20 rounded font-semibold text-[10px] transition-colors"
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
    </div>
  );
}
