import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { label: 'Markets', href: '#markets' },
  { label: 'Platform', href: '#platform' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0b0e11]/90 backdrop-blur-xl border-b border-[#2b3139]' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-on-primary-container" fill="currentColor">
              <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[#fff4d7]">
            CryptoVault
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => {
                if (l.label === 'Pricing') {
                  navigate(user ? '/app/subscription' : '/auth?mode=login');
                } else {
                  if (window.location.pathname !== '/') {
                    navigate('/' + l.href);
                  } else {
                    const el = document.querySelector(l.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className="text-sm font-medium text-muted-tertiary hover:text-on-dark transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors h-10"
            >
              Open Terminal
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="px-4 py-2 text-sm font-medium text-muted-tertiary hover:text-on-dark transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="px-4 py-2 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors h-10"
              >
                Get started
              </button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-on-surface p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden bg-[#0b0e11] border-t border-[#2b3139] px-5 py-4 flex flex-col gap-4"
        >
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => {
                setOpen(false);
                if (l.label === 'Pricing') {
                  navigate(user ? '/app/subscription' : '/auth?mode=login');
                } else {
                  if (window.location.pathname !== '/') {
                    navigate('/' + l.href);
                  } else {
                    const el = document.querySelector(l.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className="text-sm text-muted-tertiary hover:text-on-dark text-left bg-transparent border-none cursor-pointer p-0"
            >
              {l.label}
            </button>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="flex-1 px-4 py-2.5 rounded-md border border-outline-variant text-sm text-on-surface hover:bg-surface-variant transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="flex-1 px-4 py-2.5 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors"
            >
              Get started
            </button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
