import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ArrowLeftRight,
  Wallet as WalletIcon,
  Banknote,
  Activity,
  ArrowLeft,
  CreditCard,
  Bell,
} from 'lucide-react';

const navItems = [
  { to: '/app/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/admin/wallets', label: 'Wallets', icon: WalletIcon },
  { to: '/app/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
  { to: '/app/admin/activity', label: 'Activity', icon: Activity },
  { to: '/app/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/app/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-container-lowest font-hanken">
      <div className="border-b border-outline-variant bg-surface-card">
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-primary-container/10 text-primary-container text-[11px] font-plex font-bold tracking-wider uppercase border border-primary-container/20">
              Admin
            </span>
            <h1 className="font-hanken text-lg font-bold text-on-surface">Platform control</h1>
          </div>
          <Link
            to="/app"
            className="flex items-center gap-1.5 text-xs text-muted-strong hover:text-on-surface font-bold transition-colors"
          >
            <ArrowLeft size={13} /> Back to trading desk
          </Link>
        </div>
        <nav className="px-4 sm:px-8 flex items-center gap-1 overflow-x-auto pb-px">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary-container text-on-surface'
                    : 'border-transparent text-muted-strong hover:text-on-surface'
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
