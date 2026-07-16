import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowDownLeft, ArrowUpRight, Send, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllActivity } from '../../api/admin';
import Pagination from '../../components/Pagination';

const typeIcon = {
  SIGNUP: { icon: UserPlus, color: 'text-primary-container bg-primary-container/10 border border-primary-container/20' },
  DEPOSIT: { icon: ArrowDownLeft, color: 'text-secondary bg-secondary/10 border border-secondary/20' },
  WITHDRAWAL_REQUESTED: { icon: ArrowUpRight, color: 'text-[#FCD535] bg-[#FCD535]/10 border border-[#FCD535]/20' },
  WITHDRAWAL_APPROVED: { icon: ArrowDownLeft, color: 'text-secondary bg-secondary/10 border border-secondary/20' },
  WITHDRAWAL_DECLINED: { icon: ArrowUpRight, color: 'text-error bg-error/10 border border-error/20' },
  WALLET_TRANSFER_SENT: { icon: Send, color: 'text-primary-container bg-primary-container/10 border border-primary-container/20' },
  WALLET_TRANSFER_RECEIVED: { icon: ArrowDownLeft, color: 'text-secondary bg-secondary/10 border border-secondary/20' },
  ORDER_BUY: { icon: ArrowUpRight, color: 'text-error bg-error/10 border border-error/20' },
  ORDER_SELL: { icon: ArrowDownLeft, color: 'text-secondary bg-secondary/10 border border-secondary/20' },
};

function parseUtcDate(iso) {
  if (!iso) return null;
  if (iso instanceof Date) return iso;
  let s = String(iso);
  if (!s.endsWith('Z') && !s.includes('+') && !/-\d{2}:\d{2}$/.test(s)) {
    s += 'Z';
  }
  return new Date(s);
}

export default function AdminActivity() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllActivity()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load activity.'))
      .finally(() => setLoading(false));
  }, []);

  const types = ['ALL', ...new Set(items.map((i) => i.type))];
  const filtered = filter === 'ALL' ? items : items.filter((i) => i.type === filter);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16 font-hanken">
      <PageHeader
        eyebrow="Audit trail"
        title="Full activity"
        description="Every notable action across every user — who did what, and when."
        action={
          types.length > 1 && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface font-plex font-bold outline-none focus:border-primary-container"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'All activity' : t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )
        }
      />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
        >
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container-low border border-outline-variant animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-error">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={28} className="mx-auto text-muted-strong mb-3" />
              <p className="text-sm text-muted-tertiary font-bold">No activity recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-outline-variant/40">
                {currentItems.map((n) => {
                  const meta = typeIcon[n.type] || { icon: Activity, color: 'text-muted-strong bg-surface-container-low border border-outline-variant' };
                  const Icon = meta.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 px-5 sm:px-6 py-3.5 hover:bg-surface-variant/20 transition-colors">
                      <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-on-surface font-bold truncate">
                            {n.user?.fullName || n.user?.email || 'Unknown user'}
                          </span>
                          <span className="text-xs text-muted-strong font-plex shrink-0 font-semibold">
                            {n.timestamp ? parseUtcDate(n.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-tertiary mt-0.5 font-medium">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
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
