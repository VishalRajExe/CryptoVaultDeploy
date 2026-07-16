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
    <div className="pb-16 font-hanken">
      <PageHeader eyebrow="Management" title="Announcements & Notifications" description="Dispatch global banner alerts, popup broadcasts, or direct targeted user notifications." />

      <div className="px-4 sm:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Create and send form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-outline-variant bg-surface-card p-5 sm:p-6 space-y-6"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-outline-variant">
            <Bell size={18} className="text-primary-container" />
            <h2 className="font-hanken text-base font-bold text-on-surface">Compose Broadcast</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target group */}
            <div>
              <label className="text-xs text-muted-strong font-bold font-plex uppercase tracking-wider mb-1.5 block">Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('GLOBAL')}
                  className={`flex items-center justify-center gap-2 py-3 rounded border text-xs font-bold transition-colors ${
                    targetType === 'GLOBAL'
                      ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-muted-strong hover:bg-surface-variant'
                  }`}
                >
                  <Globe size={14} /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('SELECTED')}
                  className={`flex items-center justify-center gap-2 py-3 rounded border text-xs font-bold transition-colors ${
                    targetType === 'SELECTED'
                      ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-muted-strong hover:bg-surface-variant'
                  }`}
                >
                  <Users size={14} /> Selected Users
                </button>
              </div>
            </div>

            {/* User Selector for targeted audience */}
            {targetType === 'SELECTED' && (
              <div className="border border-outline-variant rounded bg-surface-container-low p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-strong font-plex">Select Target Users ({selectedUserIds.size} chosen)</span>
                  <button
                    type="button"
                    onClick={handleSelectAllUsers}
                    className="text-[10px] font-plex text-primary-container hover:text-primary-active font-bold"
                  >
                    {selectedUserIds.size === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-outline-variant/40 scrollbar-none pr-1">
                  {users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleToggleUser(u.id)}
                      className={`flex items-center justify-between py-2 px-2.5 rounded cursor-pointer transition-colors ${
                        selectedUserIds.has(u.id) ? 'bg-surface-variant' : 'hover:bg-surface-variant/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-on-surface truncate">{u.fullName}</div>
                        <div className="text-[10px] text-muted-strong truncate font-plex font-semibold">{u.email}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => {}} // Click handled by div
                        className="rounded border-outline-variant text-primary-container focus:ring-primary-container bg-surface-container-low"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Mode */}
            <div>
              <label className="text-xs text-muted-strong font-bold font-plex uppercase tracking-wider mb-1.5 block">Notification Delivery Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNotifType('IN_APP')}
                  className={`flex items-center justify-center gap-2 py-3 rounded border text-xs font-bold transition-colors ${
                    notifType === 'IN_APP'
                      ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-muted-strong hover:bg-surface-variant'
                  }`}
                >
                  <Bell size={14} /> In-App Notification
                </button>
                <button
                  type="button"
                  onClick={() => setNotifType('POPUP')}
                  className={`flex items-center justify-center gap-2 py-3 rounded border text-xs font-bold transition-colors ${
                    notifType === 'POPUP'
                      ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-muted-strong hover:bg-surface-variant'
                  }`}
                >
                  <AlertCircle size={14} /> Dashboard Popup
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs text-muted-strong font-bold font-plex uppercase tracking-wider mb-1.5 block">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter important alert message or announcement info..."
                rows={4}
                className="w-full rounded border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-container placeholder:text-muted-strong font-medium resize-none"
              />
            </div>

            {/* Scheduled Date/Time */}
            <div>
              <label className="text-xs text-muted-strong font-bold font-plex uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                <Calendar size={13} className="text-primary-container" /> Schedule Release <span className="text-[10px] text-muted-strong font-plex font-bold">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded border border-outline-variant bg-surface-container-low px-4 py-3 text-xs text-on-surface outline-none focus:border-primary-container font-plex"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary-container font-button font-bold text-sm py-3.5 hover:bg-primary-active transition-colors disabled:opacity-60 shadow-sm"
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
          className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-outline-variant flex items-center gap-2 bg-surface-container-low">
            <Clock size={16} className="text-primary-container" />
            <span className="font-hanken text-sm font-bold text-on-surface">Broadcast Log</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container-low border border-outline-variant animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-16 text-center text-muted-strong space-y-2">
              <Bell size={24} className="mx-auto" />
              <p className="text-xs font-bold font-hanken">No broadcasts dispatched yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-outline-variant/40">
                {currentHistory.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-surface-variant/20 transition-colors">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border ${
                      item.type === 'POPUP' ? 'bg-[#FCD535]/10 text-[#FCD535] border-[#FCD535]/20' : 'bg-primary-container/10 text-primary-container border-primary-container/20'
                    }`}>
                      {item.type === 'POPUP' ? <AlertCircle size={14} /> : <Bell size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-plex text-muted-strong font-bold">
                          To: {item.user ? item.user.fullName : 'All Users'}
                        </span>
                        {item.scheduledTime && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-container/10 text-primary-container border border-primary-container/20 font-plex font-bold">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface mt-1 font-semibold leading-snug">{item.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[9px] text-muted-strong font-plex font-bold">
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
