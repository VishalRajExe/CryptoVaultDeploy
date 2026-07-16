import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Check, X, Loader2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageTransition from '../../components/PageTransition';
import { SkeletonTable } from '../../components/SkeletonLoaders';
import EmptyState from '../../components/EmptyState';
import { getAllWithdrawalRequests, proceedWithdrawal } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const statusColors = {
  PENDING: 'text-[#FCD535] bg-[#FCD535]/10 border-[#FCD535]/20',
  SUCCESS: 'text-secondary bg-secondary/10 border-secondary/20',
  DECLINE: 'text-error bg-error/10 border-error/20',
};

/* ─── Confirmation Modal ────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, isApprove, withdrawal }) {
  if (!open || !withdrawal) return null;

  const actionLabel = isApprove ? 'Approve' : 'Decline & Refund';
  const userName = withdrawal.user?.fullName || withdrawal.user?.email || 'Unknown user';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0b0e11]/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-card shadow-md overflow-hidden"
          >
            {/* Accent glow bar */}
            <div
              className={`h-1 w-full ${
                isApprove
                  ? 'bg-secondary'
                  : 'bg-error'
              }`}
            />

            <div className="p-6 sm:p-8 font-hanken">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div
                  className={`w-14 h-14 rounded flex items-center justify-center ${
                    isApprove
                      ? 'bg-secondary/10 border border-secondary/20'
                      : 'bg-error/10 border border-error/20'
                  }`}
                >
                  {isApprove ? (
                    <ShieldCheck size={26} className="text-secondary" />
                  ) : (
                    <AlertTriangle size={26} className="text-error" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-on-surface text-center mb-2">
                {isApprove ? 'Approve Withdrawal?' : 'Decline & Refund?'}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-tertiary text-center mb-6 leading-relaxed font-medium">
                Are you sure you want to <span className={`font-bold ${isApprove ? 'text-secondary' : 'text-error'}`}>{actionLabel.toUpperCase()}</span> this withdrawal request?
              </p>

              {/* Request details card */}
              <div className="rounded border border-outline-variant bg-surface-container-low p-4 mb-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-strong font-plex uppercase tracking-wider font-bold">User</span>
                  <span className="text-sm text-on-surface font-bold">{userName}</span>
                </div>
                <div className="h-px bg-outline-variant/40" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-strong font-plex uppercase tracking-wider font-bold">Amount</span>
                  <span className="text-base text-on-surface font-bold font-plex">{formatCurrency(withdrawal.amount)}</span>
                </div>
                <div className="h-px bg-outline-variant/40" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-strong font-plex uppercase tracking-wider font-bold">Request ID</span>
                  <span className="text-xs text-muted-tertiary font-plex font-bold">#{withdrawal.id}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 font-button">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded text-sm font-bold text-muted-strong bg-surface-container-low border border-outline-variant hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-3 rounded text-sm font-bold transition-all duration-200 shadow-sm ${
                    isApprove
                      ? 'bg-secondary text-void hover:bg-secondary/90'
                      : 'bg-error text-white hover:bg-error/90'
                  }`}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);
  const { push } = useToast();
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageResolved, setCurrentPageResolved] = useState(1);
  const itemsPerPage = 10;

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, withdrawal: null, isApprove: true });

  const load = () => {
    setLoading(true);
    getAllWithdrawalRequests()
      .then((data) => setWithdrawals(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load withdrawal requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Open the modal instead of window.confirm
  const openConfirm = (withdrawal, accept) => {
    setConfirmModal({ open: true, withdrawal, isApprove: accept });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, withdrawal: null, isApprove: true });
  };

  const handleConfirmedAction = async () => {
    const { withdrawal, isApprove } = confirmModal;
    if (!withdrawal) return;
    closeConfirm();

    setActingId(withdrawal.id);
    try {
      await proceedWithdrawal(withdrawal.id, isApprove);
      push(isApprove ? 'Withdrawal approved successfully.' : 'Withdrawal declined and refunded to user.', 'success');
      load();
    } catch (e) {
      push(e.friendlyMessage || 'Could not process this withdrawal.', 'error');
    } finally {
      setActingId(null);
    }
  };

  const pending = withdrawals.filter((w) => w.status === 'PENDING');
  const resolved = withdrawals.filter((w) => w.status !== 'PENDING');

  const totalPendingAmount = pending.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalApprovedAmount = resolved.filter(w => w.status === 'SUCCESS').reduce((sum, w) => sum + (w.amount || 0), 0);

  const totalPagesPending = Math.ceil(pending.length / itemsPerPage);
  const currentPending = pending.slice((currentPagePending - 1) * itemsPerPage, currentPagePending * itemsPerPage);

  const totalPagesResolved = Math.ceil(resolved.length / itemsPerPage);
  const currentResolved = resolved.slice((currentPageResolved - 1) * itemsPerPage, currentPageResolved * itemsPerPage);

  return (
    <PageTransition className="pb-16 font-hanken">
      <PageHeader
        eyebrow="Review Desk"
        title="Withdrawal Requests"
        description={`${pending.length} pending request${pending.length === 1 ? '' : 's'} awaiting platform confirmation.`}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={closeConfirm}
        onConfirm={handleConfirmedAction}
        isApprove={confirmModal.isApprove}
        withdrawal={confirmModal.withdrawal}
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* Administrative summaries */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
            <span className="text-[10px] text-muted-strong uppercase tracking-wider font-plex font-bold">Total Pending Value</span>
            <div className="font-plex text-xl font-bold text-[#FCD535] mt-1">{formatCurrency(totalPendingAmount)}</div>
          </div>
          <div className="rounded-lg border border-outline-variant bg-surface-card p-5">
            <span className="text-[10px] text-muted-strong uppercase tracking-wider font-plex font-bold">Total Processed Value</span>
            <div className="font-plex text-xl font-bold text-secondary mt-1">{formatCurrency(totalApprovedAmount)}</div>
          </div>
        </div>

        {/* Pending Box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-outline-variant bg-surface-container-low font-bold">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Awaiting review</span>
          </div>

          {loading ? (
            <SkeletonTable rows={3} cols={3} />
          ) : error ? (
            <div className="p-10 text-center text-sm text-error">{error}</div>
          ) : pending.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="No pending requests"
              description="There are currently no withdrawal requests pending audit."
            />
          ) : (
            <>
              <div className="divide-y divide-outline-variant/40">
                {currentPending.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-surface-variant/20 transition-colors">
                    <div>
                      <div className="text-sm text-on-surface font-bold">
                        {w.user?.fullName || w.user?.email || 'Unknown user'}
                      </div>
                      <div className="text-xs text-muted-strong font-plex mt-0.5 font-semibold">
                        Request ID #{w.id} · {w.date ? new Date(w.date).toLocaleString() : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-plex text-base text-on-surface font-bold mr-2">{formatCurrency(w.amount)}</span>
                      <button
                        onClick={() => openConfirm(w, true)}
                        disabled={actingId === w.id}
                        className="w-9 h-9 rounded bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center hover:bg-secondary/20 transition-all disabled:opacity-50"
                        title="Approve request"
                      >
                        {actingId === w.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                      </button>
                      <button
                        onClick={() => openConfirm(w, false)}
                        disabled={actingId === w.id}
                        className="w-9 h-9 rounded bg-error/10 text-error border border-error/20 flex items-center justify-center hover:bg-error/20 transition-all disabled:opacity-50"
                        title="Decline & refund"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPagePending}
                totalPages={totalPagesPending}
                onPageChange={setCurrentPagePending}
              />
            </>
          )}
        </motion.div>

        {/* Resolved/History Box */}
        {!loading && resolved.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-outline-variant bg-surface-container-low font-bold">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Processed History</span>
            </div>
            <div className="divide-y divide-outline-variant/40">
              {currentResolved.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-surface-variant/20 transition-colors">
                  <div>
                    <div className="text-sm text-on-surface font-bold">{w.user?.fullName || w.user?.email || 'Unknown user'}</div>
                    <div className="text-xs text-muted-strong font-plex mt-0.5 font-semibold">
                      Request ID #{w.id} · {w.date ? new Date(w.date).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-plex text-sm text-on-surface font-bold mr-2">{formatCurrency(w.amount)}</span>
                    <span
                      className={`text-[10px] font-plex font-bold px-2 py-0.5 rounded border ${
                        statusColors[w.status] || statusColors.PENDING
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPageResolved}
              totalPages={totalPagesResolved}
              onPageChange={setCurrentPageResolved}
            />
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
