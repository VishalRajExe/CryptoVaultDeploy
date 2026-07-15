import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, Globe, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllUsers, getAllActivity, sendGlobalNotification, sendUsersNotification } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';

export default function AdminNotifications() {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Form fields
  const [targetType, setTargetType] = useState('GLOBAL'); // 'GLOBAL' | 'SELECTED'
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [notifType, setNotifType] = useState('IN_APP'); // 'IN_APP' | 'POPUP'
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const { push } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = () => {
    setLoading(true);
    Promise.all([getAllUsers(), getAllActivity()])
      .then(([usersData, activityData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        
        // Filter history to only show notifications sent by admin or marked as announcement/popup
        const announcementHistory = (Array.isArray(activityData) ? activityData : [])
          .filter(item => item.type === 'POPUP' || item.type === 'IN_APP' || item.type === 'ANNOUNCEMENT');
        setHistory(announcementHistory);
      })
      .catch((e) => push(e.friendlyMessage || 'Could not load data.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      push('Please enter a message.', 'error');
      return;
    }

    if (targetType === 'SELECTED' && selectedUserIds.size === 0) {
      push('Please select at least one user.', 'error');
      return;
    }

    setSending(true);
    try {
      // Format scheduledTime for LocalDateTime (e.g. 2026-07-15T12:00:00)
      const isoTime = scheduledTime ? new Date(scheduledTime).toISOString().slice(0, 19) : null;

      if (targetType === 'GLOBAL') {
        await sendGlobalNotification(notifType, message, isoTime);
        push('Global announcement dispatched successfully!', 'success');
      } else {
        await sendUsersNotification(Array.from(selectedUserIds), notifType, message, isoTime);
        push(`Notification sent to ${selectedUserIds.size} selected users!`, 'success');
      }

      // Reset form
      setMessage('');
      setScheduledTime('');
      setSelectedUserIds(new Set());
      loadData();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to send notifications.', 'error');
    } finally {
      setSending(false);
    }
  };

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Management" title="Announcements & Notifications" description="Dispatch global banner alerts, popup broadcasts, or direct targeted user notifications." />

      <div className="px-4 sm:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Create and send form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 sm:p-6 backdrop-blur-xl space-y-6"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
            <Bell size={18} className="text-mint" />
            <h2 className="font-display text-base font-semibold text-ink">Compose Broadcast</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target group */}
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('GLOBAL')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl border text-xs font-semibold font-display transition-colors ${
                    targetType === 'GLOBAL'
                      ? 'border-mint bg-mint/5 text-mint'
                      : 'border-white/10 bg-white/[0.01] text-ink-muted hover:bg-white/[0.03]'
                  }`}
                >
                  <Globe size={14} /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('SELECTED')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl border text-xs font-semibold font-display transition-colors ${
                    targetType === 'SELECTED'
                      ? 'border-mint bg-mint/5 text-mint'
                      : 'border-white/10 bg-white/[0.01] text-ink-muted hover:bg-white/[0.03]'
                  }`}
                >
                  <Users size={14} /> Selected Users
                </button>
              </div>
            </div>

            {/* User Selector for targeted audience */}
            {targetType === 'SELECTED' && (
              <div className="border border-white/10 rounded-xl bg-void-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted">Select Target Users ({selectedUserIds.size} chosen)</span>
                  <button
                    type="button"
                    onClick={handleSelectAllUsers}
                    className="text-[10px] font-mono-tab text-mint hover:text-mint-400 font-semibold"
                  >
                    {selectedUserIds.size === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-white/[0.04] scrollbar-none pr-1">
                  {users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleToggleUser(u.id)}
                      className={`flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedUserIds.has(u.id) ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-ink truncate">{u.fullName}</div>
                        <div className="text-[10px] text-ink-faint truncate">{u.email}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => {}} // Click handled by div
                        className="rounded border-white/10 text-mint focus:ring-mint bg-void"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Mode */}
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Notification Delivery Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNotifType('IN_APP')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-semibold font-display transition-colors ${
                    notifType === 'IN_APP'
                      ? 'border-mint bg-mint/5 text-mint'
                      : 'border-white/10 bg-white/[0.01] text-ink-muted hover:bg-white/[0.03]'
                  }`}
                >
                  <Bell size={14} /> In-App Notification
                </button>
                <button
                  type="button"
                  onClick={() => setNotifType('POPUP')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-semibold font-display transition-colors ${
                    notifType === 'POPUP'
                      ? 'border-mint bg-mint/5 text-mint'
                      : 'border-white/10 bg-white/[0.01] text-ink-muted hover:bg-white/[0.03]'
                  }`}
                >
                  <AlertCircle size={14} /> Dashboard Popup
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter important alert message or announcement info..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 text-sm text-ink outline-none focus:border-mint/50 placeholder:text-ink-faint resize-none"
              />
            </div>

            {/* Scheduled Date/Time */}
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block flex items-center gap-1.5">
                <Calendar size={13} className="text-mint" /> Schedule Release <span className="text-[10px] text-ink-faint">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 text-xs text-ink outline-none focus:border-mint/50 font-mono-tab"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={15} /> Dispatch Alert
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* History / Audit trail */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <Clock size={16} className="text-mint" />
            <span className="font-display text-sm font-semibold text-ink">Broadcast Log</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-16 text-center text-ink-faint space-y-2">
              <Bell size={24} className="mx-auto" />
              <p className="text-xs">No broadcasts dispatched yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/[0.05]">
                {currentHistory.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'POPUP' ? 'bg-amber-400/10 text-amber-400' : 'bg-mint-900/50 text-mint'
                    }`}>
                      {item.type === 'POPUP' ? <AlertCircle size={14} /> : <Bell size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-tab text-ink-faint">
                          To: {item.user ? item.user.fullName : 'All Users'}
                        </span>
                        {item.scheduledTime && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-mono-tab">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink mt-1 font-medium leading-snug">{item.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[9px] text-ink-faint font-mono-tab">
                        <span>Created: {new Date(item.timestamp).toLocaleString()}</span>
                        {item.scheduledTime && (
                          <span>Release: {new Date(item.scheduledTime).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
