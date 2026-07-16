import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllOrders } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import Pagination from '../../components/Pagination';

const statusColors = {
  PENDING: 'text-[#FCD535] bg-[#FCD535]/10 border-[#FCD535]/20',
  FILLED: 'text-secondary bg-secondary/10 border-secondary/20',
  SUCCESS: 'text-secondary bg-secondary/10 border-secondary/20',
  CANCELLED: 'text-muted-strong bg-surface-container-low border-outline-variant',
  ERROR: 'text-error bg-error/10 border-error/20',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const currentOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16 font-hanken">
      <PageHeader eyebrow="Trading" title="All orders" description={`${orders.length} order${orders.length === 1 ? '' : 's'} across every user.`} />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
        >
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-container-low border border-outline-variant animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight size={28} className="mx-auto text-muted-strong mb-3" />
              <p className="text-sm text-muted-tertiary font-bold">No orders placed yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left bg-surface-container-low border-b border-outline-variant text-muted-strong text-[10px] uppercase tracking-wider font-plex font-bold">
                    <th className="px-5 sm:px-6 py-3 font-bold">Order</th>
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Asset</th>
                    <th className="px-4 py-3 font-bold">Price</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-5 sm:px-6 py-3 font-bold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {currentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="px-5 sm:px-6 py-3.5 font-plex text-muted-strong text-xs font-semibold">#{o.id}</td>
                      <td className="px-4 py-3.5 text-on-surface text-xs font-bold truncate max-w-[10rem]">
                        {o.user?.fullName || o.user?.email || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            o.orderType === 'BUY' ? 'text-secondary' : 'text-error'
                          }`}
                        >
                          {o.orderType === 'BUY' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {o.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {o.orderItem?.coin?.image && (
                            <img src={o.orderItem.coin.image} alt="" className="w-5 h-5 rounded-full" />
                          )}
                          <span className="text-on-surface font-bold">{o.orderItem?.coin?.symbol?.toUpperCase() || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-plex text-muted-tertiary font-bold">{formatCurrency(o.price)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-plex font-bold px-2 py-0.5 rounded border ${
                            statusColors[o.status] || statusColors.PENDING
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right text-xs text-muted-strong font-plex font-semibold">
                        {o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
