import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllUsers } from '../../api/admin';
import Pagination from '../../components/Pagination';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16 font-hanken">
      <PageHeader eyebrow="People" title="Users" description={`${users.length} registered account${users.length === 1 ? '' : 's'}.`} />

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
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={28} className="mx-auto text-muted-strong mb-3" />
              <p className="text-sm text-muted-tertiary font-bold">No users yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left bg-surface-container-low border-b border-outline-variant text-muted-strong text-[10px] uppercase tracking-wider font-plex font-bold">
                    <th className="px-5 sm:px-6 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Mobile</th>
                    <th className="px-4 py-3 font-bold">Role</th>
                    <th className="px-4 py-3 font-bold">Verified</th>
                    <th className="px-4 py-3 font-bold">2FA</th>
                    <th className="px-5 sm:px-6 py-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {currentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-container/10 text-primary-container border border-outline-variant flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(u.fullName || u.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-on-surface font-bold truncate">{u.fullName}</div>
                            <div className="text-xs text-muted-strong truncate font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-tertiary font-plex text-xs font-bold">{u.mobile || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-plex font-bold px-2 py-0.5 rounded border ${
                            u.role === 'ROLE_ADMIN'
                              ? 'text-primary-container bg-primary-container/10 border-primary-container/20'
                              : 'text-muted-strong bg-surface-container-low border-outline-variant'
                          }`}
                        >
                          {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.isVerified ? (
                          <CheckCircle2 size={15} className="text-secondary" />
                        ) : (
                          <span className="text-xs text-muted-strong">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.twoFactorAuth?.isEnabled ? (
                          <ShieldCheck size={15} className="text-secondary" />
                        ) : (
                          <span className="text-xs text-muted-strong">—</span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right">
                        <span className="text-[10px] font-plex font-bold px-2 py-0.5 rounded border border-outline-variant text-muted-strong bg-surface-container-low">
                          {u.status}
                        </span>
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
