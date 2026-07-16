import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Wallet,
  LineChart,
  Star,
  Lock,
  ArrowRight,
  Smartphone,
  KeyRound,
  Eye,
  Plus,
  Minus,
  Globe2,
} from 'lucide-react';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import TickerTape from '../components/TickerTape';
import HeroDashboard from '../components/HeroDashboard';
import Sparkline from '../components/Sparkline';
import { generateCandles } from '../utils/chartData';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
      <span className="font-plex text-xs tracking-[0.18em] uppercase text-primary-container">{children}</span>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: 'Sub-second order routing',
    desc: 'Market and limit orders settle against live order books the instant you confirm — no queue, no slippage surprises.',
    accent: 'mint',
  },
  {
    icon: Wallet,
    title: 'One vault, every asset',
    desc: 'Deposit, withdraw, and transfer wallet-to-wallet from a single balance. Your portfolio updates in real time as positions move.',
    accent: 'violet',
  },
  {
    icon: ShieldCheck,
    title: 'Two-factor by default',
    desc: 'Email and device verification gate every sign-in. Enable OTP-based 2FA in one tap from Security settings.',
    accent: 'mint',
  },
  {
    icon: LineChart,
    title: 'Live market intelligence',
    desc: 'Track trending coins, search the full market, and chart price history from 24 hours to all-time in one terminal.',
    accent: 'violet',
  },
  {
    icon: Star,
    title: 'Watchlists that matter',
    desc: 'Pin the assets you actually trade. Your watchlist syncs across sessions the moment you add a coin.',
    accent: 'mint',
  },
  {
    icon: Lock,
    title: 'Bank-grade custody',
    desc: 'Withdrawals route to verified payment details only, with every transfer logged to an auditable wallet ledger.',
    accent: 'violet',
  },
];

const steps = [
  {
    n: '01',
    title: 'Create your vault',
    desc: 'Register with your email and set a password. We verify your identity before your first trade clears.',
  },
  {
    n: '02',
    title: 'Fund your wallet',
    desc: 'Deposit instantly. Your balance is available the moment funds are confirmed — no multi-day holds.',
  },
  {
    n: '03',
    title: 'Trade with conviction',
    desc: 'Buy and sell across major assets with live pricing, then track performance from your portfolio dashboard.',
  },
];

const faqs = [
  {
    q: 'How fast are deposits reflected in my balance?',
    a: 'Deposits post to your wallet balance immediately after confirmation, so you can place an order the moment funds land.',
  },
  {
    q: 'Is two-factor authentication required?',
    a: 'It is optional but strongly recommended. Once enabled from Security settings, every sign-in requires an emailed one-time code in addition to your password.',
  },
  {
    q: 'Can I withdraw to my bank account?',
    a: 'Yes. Add your account holder name, account number, IFSC, and bank name once under Payment Details, then submit a withdrawal request from your wallet.',
  },
  {
    q: 'What happens if I forget my password?',
    a: 'Request a reset from the sign-in screen. We send a one-time code to your email that lets you set a new password in under a minute.',
  },
];

function FeatureCard({ icon: Icon, title, desc, accent }) {
  const isMint = accent === 'mint';
  return (
    <motion.div
      variants={fadeUp}
      className="group relative rounded-xl border border-outline-variant bg-surface-card p-6 hover:border-outline transition-colors duration-300 overflow-hidden"
    >
      <div
        className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isMint ? 'bg-primary-container/20' : 'bg-info/20'
        }`}
      />
      <div
        className={`relative w-10 h-10 rounded-lg flex items-center justify-center mb-5 ${
          isMint ? 'bg-primary-container/10 text-primary-container' : 'bg-surface-elevated text-info'
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <h3 className="relative font-hanken text-base font-bold text-on-surface mb-2">{title}</h3>
      <p className="relative text-sm text-muted-tertiary leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StatBlock({ value, label, suffix = '' }) {
  return (
    <motion.div variants={fadeUp} className="text-center sm:text-left">
      <div className="font-plex text-3xl sm:text-4xl font-bold text-on-surface">
        {value}
        <span className="text-primary-container">{suffix}</span>
      </div>
      <div className="text-[10px] text-muted-strong mt-1.5 tracking-wider uppercase font-plex">{label}</div>
    </motion.div>
  );
}

function FaqItem({ q, a, isOpen, onClick }) {
  return (
    <div className="border-b border-outline-variant">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-hanken text-sm sm:text-base text-on-surface font-semibold">{q}</span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center text-muted-tertiary">
          {isOpen ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="text-sm text-muted-tertiary leading-relaxed pb-5 pr-10">{a}</p>
      </motion.div>
    </div>
  );
}

const marketCoins = [
  { sym: 'BTC', name: 'Bitcoin', price: 66870.95, change: 2.41, color: '#D7FF4F' },
  { sym: 'ETH', name: 'Ethereum', price: 3482.11, change: 1.08, color: '#7C5CFF' },
  { sym: 'SOL', name: 'Solana', price: 168.42, change: -0.86, color: '#FF3B69' },
  { sym: 'XRP', name: 'XRP', price: 0.612, change: 4.32, color: '#D7FF4F' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [sparks] = useState(() => marketCoins.map(() => generateCandles(28, 100, 0.025).map((c) => c.close)));

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface antialiased overflow-x-hidden">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section className="relative pt-32 pb-10 sm:pt-40 sm:pb-16 px-5 sm:px-8">
        <div
          className="absolute inset-0 bg-grid-faint bg-grid opacity-60"
          style={{ maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)' }}
          aria-hidden
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-container/[0.08] blur-[140px] rounded-full" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-1.5 mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse-glow" />
              <span className="text-xs text-muted-strong font-plex">Markets open · settling in real time</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-hanken text-[2.6rem] leading-[1.05] sm:text-6xl sm:leading-[1.04] font-bold tracking-tight text-on-surface uppercase"
            >
              Trade digital assets
              <br />
              with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary">conviction</span>,
              <br />
              not guesswork.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-base sm:text-lg text-muted-tertiary max-w-lg leading-relaxed">
              CryptoVault is a precision trading desk for crypto — live order books,
              instant wallet settlement, and bank-grade custody, built for people who
              treat trading as a discipline.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="px-6 py-3.5 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>Open your vault</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="px-6 py-3.5 rounded-md border border-outline-variant text-on-surface font-button hover:bg-surface-variant transition-colors"
              >
                Sign in
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-xs text-muted-strong">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary-container" /> 2FA secured
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-primary-container" /> Encrypted wallets
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={14} className="text-primary-container" /> Global markets
              </span>
            </motion.div>
          </motion.div>

          <HeroDashboard />
        </div>
      </section>

      <TickerTape />

      {/* ---------------- MARKET SNAPSHOT ---------------- */}
      <section id="markets" className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
          >
            <div>
              <SectionEyebrow>Live snapshot</SectionEyebrow>
              <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-4xl font-bold text-on-surface max-w-md">
                The market, refreshed every tick.
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} className="text-sm text-muted-tertiary max-w-xs">
              A preview of what loads in your terminal — full top-50 rankings, search, and detail charts on every coin.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {marketCoins.map((c, idx) => (
              <motion.div
                key={c.sym}
                variants={fadeUp}
                className="rounded-xl border border-outline-variant bg-surface-card p-5 hover:border-outline transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-plex text-[10px] font-bold"
                      style={{ background: `${c.color}22`, color: c.color }}
                    >
                      {c.sym.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-hanken text-sm font-bold text-on-surface leading-none">{c.sym}</div>
                      <div className="text-[11px] text-muted-strong mt-1">{c.name}</div>
                    </div>
                  </div>
                  <span
                    className={`font-plex text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                      c.change >= 0 ? 'text-secondary bg-secondary-container/10' : 'text-error bg-error-container/10'
                    }`}
                  >
                    {c.change >= 0 ? '+' : ''}
                    {c.change.toFixed(2)}%
                  </span>
                </div>
                <div className="h-10 -mx-1 mb-2">
                  <Sparkline data={sparks[idx]} width={240} height={40} color={c.color} />
                </div>
                <div className="font-plex text-lg text-on-surface font-semibold">
                  ${c.price < 1 ? c.price.toFixed(3) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="platform" className="py-24 px-5 sm:px-8 bg-[#0b0e11] border-y border-outline-variant">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="max-w-xl mb-14"
          >
            <SectionEyebrow>The terminal</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-4xl font-bold text-on-surface">
              Every module a trading desk needs, none it doesn't.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-tertiary text-sm sm:text-base">
              Built directly on top of CryptoVault's trading engine — wallets, orders, assets, and watchlists all stay in sync.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-16 items-start">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="lg:sticky lg:top-28"
          >
            <SectionEyebrow>Getting started</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-4xl font-bold text-on-surface mb-5">
              From sign-up to first trade in three steps.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-tertiary text-sm sm:text-base mb-8">
              No paperwork queue, no waiting period on your balance. Your vault is ready the moment verification clears.
            </motion.p>
            <motion.div variants={fadeUp}>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="px-6 py-3.5 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>Create your vault</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-4"
          >
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="flex gap-6 rounded-xl border border-outline-variant bg-surface-card p-6 sm:p-7"
              >
                <span className="font-plex text-3xl font-bold text-outline-variant leading-none shrink-0">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-hanken text-base font-bold text-on-surface mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-tertiary leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section id="security" className="py-24 px-5 sm:px-8 bg-[#0b0e11] border-y border-outline-variant">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <SectionEyebrow>Security</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-4xl font-bold text-on-surface mb-5">
              Custody that takes nothing for granted.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-tertiary text-sm sm:text-base mb-8 max-w-md">
              Every account ships with email verification and optional two-factor
              authentication. Every withdrawal checks against your saved bank details
              and a real-time balance — never an assumption.
            </motion.p>

            <motion.div variants={stagger} className="space-y-4">
              {[
                { icon: KeyRound, title: 'Encrypted credentials', desc: 'Passwords are hashed, never stored or transmitted in plain text.' },
                { icon: Smartphone, title: 'One-time codes by email', desc: 'A fresh OTP gates sign-in whenever 2FA is enabled on your account.' },
                { icon: Eye, title: 'Full transaction visibility', desc: 'Every deposit, transfer, and withdrawal is logged to your wallet ledger.' },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-hanken text-sm font-bold text-on-surface">{item.title}</div>
                    <div className="text-sm text-muted-tertiary mt-0.5">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-primary-container/5 blur-[100px] rounded-full" aria-hidden />
            <div className="relative rounded-xl border border-outline-variant bg-surface-card backdrop-blur-xl p-7">
              <div className="flex items-center justify-between mb-6">
                <span className="font-hanken text-sm font-bold text-on-surface">Two-factor authentication</span>
                <span className="w-10 h-5 rounded-full bg-primary-container/90 relative">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-[#0b0e11]" />
                </span>
              </div>
              <p className="text-xs text-muted-strong mb-6">A code was sent to your email</p>
              <div className="flex gap-2.5 mb-7">
                {['4', '1', '9', '2', '0', '7'].map((d, i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 rounded-lg border flex items-center justify-center font-plex text-lg ${
                      i < 4 ? 'border-primary-container/40 bg-primary-container/10 text-primary-container' : 'border-outline-variant text-muted-strong animate-blink'
                    }`}
                  >
                    {i < 4 ? d : ''}
                  </div>
                ))}
              </div>
              <div className="h-px bg-outline-variant mb-6" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-strong">Session</span>
                  <span className="font-plex text-on-surface">7f2a-91cd-44e0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-strong">Device</span>
                  <span className="text-on-surface">Verified · Chrome on macOS</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-strong">Status</span>
                  <span className="text-secondary flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-glow" /> Verifying
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="py-20 px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8"
        >
          <StatBlock value="120" suffix="+" label="Tradeable assets" />
          <StatBlock value="<1" suffix="s" label="Avg. order settlement" />
          <StatBlock value="24/7" label="Market access" />
          <StatBlock value="99.9" suffix="%" label="Platform uptime" />
        </motion.div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="py-24 px-5 sm:px-8 bg-[#0b0e11] border-y border-outline-variant">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <div className="flex justify-center">
              <SectionEyebrow>Questions</SectionEyebrow>
            </div>
            <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-4xl font-bold text-on-surface">
              Frequently asked
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            {faqs.map((f, i) => (
              <motion.div key={f.q} variants={fadeUp}>
                <FaqItem q={f.q} a={f.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="relative py-28 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" style={{ maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)' }} aria-hidden />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary-container/[0.05] blur-[150px] rounded-full" aria-hidden />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="font-hanken text-3xl sm:text-5xl font-bold text-on-surface leading-tight uppercase">
            Your vault is one sign-up away.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-muted-tertiary text-base max-w-lg mx-auto">
            Join a desk built for traders who want speed, clarity, and custody they can verify — not just trust.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="px-7 py-3.5 rounded-md bg-primary-container text-on-primary font-button hover:bg-primary-active transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>Open your vault</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- LIGHT FOOTER ---------------- */}
      <footer className="border-t border-[#eaecef] py-12 px-5 sm:px-8 bg-[#fafafa] text-[#181a20]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="CryptoVault Logo" className="w-7 h-7 shrink-0" />
            <span className="font-display text-sm font-bold text-on-primary-container">CryptoVault</span>
          </div>
          <p className="text-xs text-[#707a8a] text-center">
            Digital asset trading carries risk. CryptoVault is a demonstration trading interface.
          </p>
          <div className="flex items-center gap-6 text-xs text-[#707a8a]">
            <Link to="/faq" className="hover:text-[#181a20] transition-colors">FAQ</Link>
            <Link to="/terms" className="hover:text-[#181a20] transition-colors">Terms &amp; Conditions</Link>
            <span>© {new Date().getFullYear()} CryptoVault</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
