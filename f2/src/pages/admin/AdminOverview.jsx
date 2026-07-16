import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ArrowLeftRight,
  Banknote,
  Wallet as WalletIcon,
  Clock,
  Repeat,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import { getAdminStats } from '../../api/admin';
import { formatCurrency, formatCompactNumber } from '../../utils/chartData';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const ACCENTS = {
  mint: { text: 'text-secondary', bg: 'bg-secondary/10 border border-secondary/20', ring: '', hex: '#02C076' },
  neutral: { text: 'text-primary-container', bg: 'bg-primary-container/10 border border-primary-container/20', ring: '', hex: '#FCD535' },
  carmine: { text: 'text-error', bg: 'bg-error/10 border border-error/20', ring: '', hex: '#E84158' },
};

function StatCard({ icon: Icon, label, value, sub, accent = 'neutral' }) {
  const c = ACCENTS[accent] || ACCENTS.neutral;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="rounded-lg border border-outline-variant bg-surface-card p-6 relative overflow-hidden group transition-colors hover:border-outline"
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: c.hex }}
      />
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 relative ${c.bg} ${c.text} ${c.ring}`}>
        <Icon size={16} />
      </div>
      <div className="text-xs text-muted-strong uppercase tracking-wide font-plex mb-1.5 relative font-bold">{label}</div>
      <div className="font-hanken text-2xl font-bold text-on-surface relative">{value}</div>
      {sub && <div className="text-xs text-muted-tertiary mt-1 relative font-semibold">{sub}</div>}
    </motion.div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-lg border border-outline-variant bg-surface-card p-6 ${className}`}
    >
      <div className="font-hanken text-sm font-bold text-on-surface mb-4">{title}</div>
      {children}
    </motion.div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs shadow-sm font-plex">
      <span className="text-muted-strong font-bold">{p.name}: </span>
      <span className="text-on-surface font-bold">{formatCompactNumber(p.value)}</span>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.friendlyMessage || 'Could not load platform stats.'))
      .finally(() => setLoading(false));
  }, []);

  const withdrawalDone = Math.max((stats?.totalWithdrawals || 0) - (stats?.pendingWithdrawals || 0), 0);
  const withdrawalComposition = stats
    ? [
        { name: 'Settled', value: withdrawalDone },
        { name: 'Pending', value: stats.pendingWithdrawals || 0 },
      ]
    : [];

  const activityComposition = stats
    ? [
        { name: 'Orders', value: stats.totalOrders || 0 },
        { name: 'Transactions', value: stats.totalTransactions || 0 },
      ]
    : [];

  const pendingRatio =
    stats && stats.totalWithdrawals
      ? Math.min(100, Math.round(((stats.pendingWithdrawals || 0) / stats.totalWithdrawals) * 100))
      : 0;

  return (
    <div className="pb-16 font-hanken">
      <PageHeader
        eyebrow="Dashboard"
        title="Platform overview"
        description="Real-time aggregate numbers across every user on CryptoVault."
      />

      <div className="px-4 sm:px-8 space-y-6">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-surface-card border border-outline-variant animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-outline-variant bg-surface-card p-10 text-center text-sm text-muted-strong">
            {error}
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
              <StatCard icon={Users} label="Total users" value={stats.totalUsers} accent="mint" />
              <StatCard
                icon={ArrowLeftRight}
                label="Total orders"
                value={formatCompactNumber(stats.totalOrders)}
                accent="neutral"
              />
              <StatCard
                icon={WalletIcon}
                label="Wallet balance"
                value={formatCurrency(stats.totalWalletBalance)}
                accent="mint"
              />
              <StatCard
                icon={Repeat}
                label="Transactions"
                value={formatCompactNumber(stats.totalTransactions)}
                accent="neutral"
              />
              <StatCard icon={Banknote} label="Withdrawals" value={stats.totalWithdrawals} accent="neutral" />
              <StatCard
                icon={Clock}
                label="Pending withdrawals"
                value={stats.pendingWithdrawals}
                sub={`${pendingRatio}% of total`}
                accent="carmine"
              />
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid lg:grid-cols-3 gap-4"
            >
              <ChartCard title="Withdrawal composition" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={withdrawalComposition}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        strokeWidth={0}
                        animationDuration={800}
                      >
                        <Cell fill="#02C076" />
                        <Cell fill="#E84158" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-1 font-bold">
                  <span className="flex items-center gap-1.5 text-muted-strong">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> Settled
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-strong">
                    <span className="w-2 h-2 rounded-full bg-error" /> Pending
                  </span>
                </div>
              </ChartCard>

              <ChartCard title="Orders vs transactions" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityComposition}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        strokeWidth={0}
                        animationDuration={800}
                        animationBegin={100}
                      >
                        <Cell fill="#FCD535" />
                        <Cell fill="#4285F4" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-1 font-bold">
                  <span className="flex items-center gap-1.5 text-muted-strong">
                    <span className="w-2 h-2 rounded-full bg-primary-container" /> Orders
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-strong">
                    <span className="w-2 h-2 rounded-full bg-[#4285F4]" /> Transactions
                  </span>
                </div>
              </ChartCard>

              <ChartCard title="Pending withdrawal load" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={16}
                      data={[{ name: 'pending', value: pendingRatio, fill: '#E84158' }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: 'rgba(255,255,255,0.02)' }} dataKey="value" cornerRadius={12} animationDuration={900} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-hanken text-3xl font-bold text-error">{pendingRatio}%</span>
                    <span className="text-[10px] text-muted-strong uppercase tracking-wide font-plex mt-1 font-bold">
                      of all withdrawals
                    </span>
                  </div>
                </div>
              </ChartCard>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-lg border border-outline-variant bg-surface-card p-6 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface">Platform is healthy</div>
                  <div className="text-xs text-muted-tertiary font-medium">
                    {stats.totalUsers} users have moved {formatCurrency(stats.totalWalletBalance)} in wallet balance
                    across {formatCompactNumber(stats.totalOrders)} orders.
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
