import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllWallets } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import Pagination from '../../components/Pagination';

export default function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllWallets()
      .then((data) => setWallets(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load wallets.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(wallets.length / itemsPerPage);
  const currentWallets = wallets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = wallets.reduce((s, w) => s + (w.balance || 0), 0);

  return (
    <div className="pb-16 font-hanken">
      <PageHeader
        eyebrow="Funds"
        title="All wallets"
        description={`${wallets.length} wallet${wallets.length === 1 ? '' : 's'} · ${formatCurrency(total)} total balance.`}
      />

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
          ) : wallets.length === 0 ? (
            <div className="p-12 text-center">
              <WalletIcon size={28} className="mx-auto text-muted-strong mb-3" />
              <p className="text-sm text-muted-tertiary font-bold">No wallets found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left bg-surface-container-low border-b border-outline-variant text-muted-strong text-[10px] uppercase tracking-wider font-plex font-bold">
                    <th className="px-5 sm:px-6 py-3 font-bold">Wallet ID</th>
                    <th className="px-4 py-3 font-bold">Owner</th>
                    <th className="px-5 sm:px-6 py-3 font-bold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {currentWallets.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="px-5 sm:px-6 py-3.5 font-plex text-on-surface text-xs font-bold">#{w.id}</td>
                      <td className="px-4 py-3.5 text-muted-strong text-xs font-semibold">
                        {w.user?.fullName || w.user?.email || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right font-plex text-on-surface font-bold">
                        {formatCurrency(w.balance)}
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
