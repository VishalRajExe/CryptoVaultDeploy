import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OrderModal from '../../components/OrderModal';
import Sparkline from '../../components/Sparkline';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { getUserWatchlist } from '../../api/trading';
import { getCoinPrices } from '../../api/coins';
import { formatCurrency, generateCandles } from '../../utils/chartData';
import { normalizeCoin } from '../../utils/normalizeCoin';

const palette = ['#D7FF4F', '#7C5CFF', '#FF3B69', '#4DFFC1', '#9A82FF', '#FF6B8C'];

function WatchlistCard({ coin: c, index, onTrade }) {
  const up = c.priceChangePercentage24h >= 0;
  const color = palette[index % palette.length];
  
  const [spark, setSpark] = useState(() => 
    generateCandles(24, c.currentPrice || 100, 0.02).map((x) => x.close)
  );

  const [prevPrice, setPrevPrice] = useState(c.currentPrice);
  const [flashDirection, setFlashDirection] = useState('none'); // 'up' | 'down' | 'none'

  // Detect price changes for real-time visual indicator
  useEffect(() => {
    if (c.currentPrice > prevPrice) {
      setFlashDirection('up');
      const t = setTimeout(() => setFlashDirection('none'), 1200);
      setSpark(prev => [...prev.slice(1), c.currentPrice]);
      setPrevPrice(c.currentPrice);
      return () => clearTimeout(t);
    } else if (c.currentPrice < prevPrice) {
      setFlashDirection('down');
      const t = setTimeout(() => setFlashDirection('none'), 1200);
      setSpark(prev => [...prev.slice(1), c.currentPrice]);
      setPrevPrice(c.currentPrice);
      return () => clearTimeout(t);
    }
  }, [c.currentPrice, prevPrice]);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className={`rounded-2xl border bg-void-800/60 p-5 transition-all duration-300 relative group overflow-hidden ${
        flashDirection === 'up' 
          ? 'border-mint/55 shadow-[0_0_15px_rgba(215,255,79,0.15)] bg-mint/[0.02]' 
          : flashDirection === 'down' 
            ? 'border-carmine/55 shadow-[0_0_15px_rgba(255,59,105,0.15)] bg-carmine/[0.02]' 
            : 'border-white/[0.07] hover:border-white/[0.15]'
      }`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-white/[0.02]" />
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          {c.image && <img src={c.image} alt="" className="w-8 h-8 rounded-full" />}
          <div>
            <div className="font-display text-sm font-semibold text-ink">{c.symbol?.toUpperCase()}</div>
            <div className="text-xs text-ink-faint">{c.name}</div>
          </div>
        </div>
        <Star size={15} className="text-amber-400" fill="currentColor" />
      </div>
      
      <div className="h-10 -mx-1 mb-2 relative z-10">
        <Sparkline data={spark} width={240} height={40} color={color} />
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <span className={`font-mono-tab text-base font-semibold transition-colors duration-300 ${
          flashDirection === 'up' ? 'text-mint' : flashDirection === 'down' ? 'text-carmine' : 'text-ink'
        }`}>
          {formatCurrency(c.currentPrice)}
        </span>
        {c.priceChangePercentage24h != null && (
          <span className={`font-mono-tab text-xs flex items-center gap-0.5 transition-colors duration-300 ${up ? 'text-mint' : 'text-carmine'}`}>
            {up ? '▲' : '▼'} {Math.abs(c.priceChangePercentage24h).toFixed(2)}%
          </span>
        )}
      </div>
      
      <button
        onClick={onTrade}
        className="w-full mt-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-ink text-xs font-display font-semibold hover:bg-white/[0.08] transition-colors relative z-10"
      >
        Trade
      </button>
    </motion.div>
  );
}

export default function Watchlist() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeCoin, setTradeCoin] = useState(null);

  const loadData = async (isPoll = false) => {
    try {
      const wl = await getUserWatchlist();
      const rawCoins = (wl?.coins || []).map(normalizeCoin);
      setCoins(rawCoins);
      if (!isPoll) setLoading(false);
      return rawCoins;
    } catch (e) {
      setError(e.friendlyMessage || 'Could not load your watchlist.');
      if (!isPoll) setLoading(false);
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    let pollInterval = null;

    const initAndPoll = async () => {
      const loaded = await loadData();
      if (!active || loaded.length === 0) return;

      // Extract all watchlisted coin IDs to fetch fresh prices in a single batch request
      const ids = loaded.map((c) => c.id).join(',');

      // Start live price updates loop (every 5 seconds)
      pollInterval = setInterval(async () => {
        // Optimize: skip requests when tab is not active/visible to avoid API waste
        if (document.visibilityState !== 'visible') return;

        try {
          const prices = await getCoinPrices(ids);
          if (!prices) return;

          setCoins((prevCoins) =>
            prevCoins.map((c) => {
              const liveData = prices[c.id];
              if (liveData) {
                return {
                  ...c,
                  currentPrice: liveData.usd ?? c.currentPrice,
                  priceChangePercentage24h: liveData.usd_24h_change ?? c.priceChangePercentage24h,
                };
              }
              return c;
            })
          );
        } catch (err) {
          console.warn('Real-time price poll error:', err);
        }
      }, 5000);
    };

    initAndPoll();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <PageTransition className="pb-16">
      <PageHeader eyebrow="Pinned" title="Watchlist" description="The digital assets you are tracking most closely." />

      <div className="px-4 sm:px-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-10 text-center text-sm text-ink-muted">
            {error}
          </div>
        ) : coins.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Watchlist is empty"
            description="Star any coin from the Markets board to keep tabs on its performance here."
            actionLabel="Browse markets"
            actionTo="/app/markets"
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {coins.map((c, idx) => (
              <WatchlistCard 
                key={c.id} 
                coin={c} 
                index={idx}
                onTrade={() => setTradeCoin(c)}
              />
            ))}
          </motion.div>
        )}
      </div>

      <OrderModal coin={tradeCoin} onClose={() => setTradeCoin(null)} onSuccess={loadData} />
    </PageTransition>
  );
}
