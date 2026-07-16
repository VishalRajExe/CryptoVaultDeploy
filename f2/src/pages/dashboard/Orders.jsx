import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageTransition from '../../components/PageTransition';
import { SkeletonTable } from '../../components/SkeletonLoaders';
import EmptyState from '../../components/EmptyState';
import { ExportOrdersButton } from '../../components/ExportButton';
import { getAllOrders } from '../../api/trading';
import { formatCurrency } from '../../utils/chartData';

const statusColors = {
  PENDING: 'text-[#FCD535] bg-[#FCD535]/10 border-[#FCD535]/20',
  FILLED: 'text-[#02C076] bg-[#02C076]/10 border-[#02C076]/20',
  SUCCESS: 'text-[#02C076] bg-[#02C076]/10 border-[#02C076]/20',
  CANCELLED: 'text-muted-strong bg-surface-container-low border-outline-variant',
  PARTIALLY_FILLED: 'text-primary-container bg-primary-container/10 border-primary-container/20',
  ERROR: 'text-error bg-error/10 border-error/20',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    getAllOrders(filter === 'ALL' ? undefined : filter, undefined)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <PageTransition className="pb-16 font-hanken">
      <PageHeader
        eyebrow="Activity"
        title="Orders Ledger"
        description="Every buy and sell request you have placed on the vault."
        action={
          <div className="flex items-center gap-3">
            <ExportOrdersButton orders={orders} />
            <div className="flex items-center gap-1 p-0.5 rounded-md border border-outline-variant bg-surface-container-low">
              {['ALL', 'BUY', 'SELL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded text-xs font-button font-bold transition-all ${
                    filter === f ? 'bg-primary-container text-on-primary-container' : 'text-muted-tertiary hover:text-on-surface'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-outline-variant bg-surface-card overflow-hidden"
        >
          {loading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : error ? (
            <div className="p-10 text-center text-sm text-error bg-error-container/10 border border-error/20 m-4 rounded">{error}</div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No orders found"
              description="Your order book is currently empty. Place buy or sell orders from the Markets desk."
              actionLabel="Trade now"
              actionTo="/app/markets"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-strong text-[10px] uppercase tracking-wider font-plex border-b border-outline-variant">
                    <th className="px-5 sm:px-6 py-3.5 font-normal">Order</th>
                    <th className="px-4 py-3.5 font-normal">Type</th>
                    <th className="px-4 py-3.5 font-normal">Asset</th>
                    <th className="px-4 py-3.5 font-normal">Quantity</th>
                    <th className="px-4 py-3.5 font-normal">Price</th>
                    <th className="px-4 py-3.5 font-normal">Status</th>
                    <th className="px-5 sm:px-6 py-3.5 font-normal text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-variant/30 transition-colors">
                      <td className="px-5 sm:px-6 py-4 font-plex text-muted-strong text-xs">#{o.id}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            o.orderType === 'BUY' ? 'text-secondary' : 'text-error'
                          }`}
                        >
                          {o.orderType === 'BUY' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {o.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {o.orderItem?.coin?.image && (
                            <img src={o.orderItem.coin.image} alt="" className="w-5 h-5 rounded-full" />
                          )}
                          <span className="text-on-surface font-bold">{o.orderItem?.coin?.symbol?.toUpperCase() || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-plex text-muted-tertiary">{o.orderItem?.quantity ?? '—'}</td>
                      <td className="px-4 py-4 font-plex text-muted-tertiary font-semibold">{formatCurrency(o.price)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block text-[10px] font-plex font-bold px-2 py-0.5 rounded-full border ${
                            statusColors[o.status] || statusColors.PENDING
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right text-xs text-muted-strong font-plex font-semibold">
                        {o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
