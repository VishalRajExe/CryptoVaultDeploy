import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Loader2, ArrowUpRight, ArrowDownRight, ChevronDown, Play, Pause, SkipForward, SkipBack, X, Settings2, FastForward, Trash2, Clock, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from '../../components/UpgradeModal';
import InteractiveChart from '../../components/InteractiveChart';
import { getCoinList, searchCoins, getTop50, getMarketChart } from '../../api/coins';
import {
  addToWatchlist, getUserWatchlist, getAllOrders, placeOrder, getWallet, getUserAssets, exchangeAsset,
} from '../../api/trading';
import { normalizeCoin, parseMarketChart } from '../../utils/normalizeCoin';
import { formatCurrency, formatPercent } from '../../utils/chartData';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { key: 'fav', label: '★ Fav' },
  { key: 'top50', label: 'Top 50' },
  { key: 'live', label: 'All' },
];

const SORTS = [
  { key: 'rank', label: 'Rank' },
  { key: 'az', label: 'A → Z' },
  { key: 'gainers', label: 'Top Gainers' },
  { key: 'losers', label: 'Top Losers' },
];

const TIMEFRAMES = [
  { key: 'now', label: 'Now' },
  { key: '1', label: '1D' },
  { key: '7', label: '7D' },
  { key: '30', label: '1M' },
  { key: '90', label: '3M' },
  { key: '365', label: '1Y' },
];

export default function Markets() {
  const [tab, setTab] = useState('top50');
  const [sortKey, setSortKey] = useState('rank');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [coins, setCoins] = useState([]);
  const [top50, setTop50] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState(new Set());

  const [selected, setSelected] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7');

  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);

  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState('');
  const submittingRef = useRef(false);

  const [userAssets, setUserAssets] = useState([]);
  const [fromCoin, setFromCoin] = useState(null);
  const [toCoin, setToCoin] = useState(null);
  const [exchangeQuantity, setExchangeQuantity] = useState('');
  const [exchanging, setExchanging] = useState(false);

  const { push } = useToast();

  // Mobile responsive views: 'markets' (list), 'chart' (middle pane), 'trade' (order execution)
  const [activeMobileView, setActiveMobileView] = useState('chart');

  const {
    isReplayMode, activeSession, replayCandles, replayWallet, replayOrders,
    loadSession, exitReplayMode, executeControl, placeVirtualOrder
  } = useReplay();

  const { subscription, user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [replayModalTab, setReplayModalTab] = useState('new');
  const [replaySessions, setReplaySessions] = useState([]);
  const [replayForm, setReplayForm] = useState({ name: '', startTime: '', timeframe: '1d', initialBalance: 10000 });
  const [loadingReplay, setLoadingReplay] = useState(false);

  const fetchSessions = async () => {
    try {
      const { getReplaySessions } = await import('../../api/replay');
      const sessions = await getReplaySessions();
      setReplaySessions(sessions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (replayModalOpen) fetchSessions();
  }, [replayModalOpen]);

  // Initial data
  useEffect(() => {
    setLoadingList(true);
    Promise.all([getCoinList(0).catch(() => []), getTop50().catch(() => [])])
      .then(([liveList, top50List]) => {
        const normLive = (Array.isArray(liveList) ? liveList : []).map(normalizeCoin);
        const normTop = (Array.isArray(top50List) ? top50List : []).map(normalizeCoin);
        setCoins(normLive);
        setTop50(normTop);
        setSelected((prev) => prev || normTop[0] || normLive[0] || null);
      })
      .finally(() => setLoadingList(false));

    getUserWatchlist()
      .then((wl) => setWatchlistIds(new Set((wl?.coins || []).map((c) => c.id))))
      .catch(() => {});

    getWallet().then(setWallet).catch(() => {});
    getUserAssets().then(setUserAssets).catch(() => {});
    refreshOrders();
  }, []);

  const refreshUserData = () => {
    getWallet().then(setWallet).catch(() => {});
    getUserAssets().then(setUserAssets).catch(() => {});
    refreshOrders();
  };

  // Set defaults for fromCoin / toCoin when coins or selected changes
  useEffect(() => {
    if (selected) {
      setFromCoin((prev) => prev || selected);
    } else if (coins.length > 0) {
      setFromCoin((prev) => prev || coins[0]);
    }
  }, [selected, coins]);

  useEffect(() => {
    if (coins.length > 0 && fromCoin) {
      setToCoin((prev) => {
        if (prev && prev.id !== fromCoin.id) return prev;
        const fallback = coins.find(c => c.id !== fromCoin.id) || coins[0];
        return fallback;
      });
    }
  }, [fromCoin, coins]);

  // Real-time tick effect for market prices
  useEffect(() => {
    const jitter = (arr) => arr.map(c => {
      const price = c.currentPrice;
      if (price == null) return c;
      const newVal = price * (1 + (Math.random() - 0.5) * 0.002);
      return { ...c, currentPrice: newVal };
    });

    const interval = setInterval(() => {
      setCoins(prev => jitter(prev));
      setTop50(prev => jitter(prev));
      setSelected(prev => {
        if (!prev || prev.currentPrice == null) return prev;
        const newVal = prev.currentPrice * (1 + (Math.random() - 0.5) * 0.002);
        return { ...prev, currentPrice: newVal };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const refreshOrders = () => {
    getAllOrders().then((data) => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
  };

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      searchCoins(query)
        .then((res) => setSearchResults((res?.coins || []).map(normalizeCoin)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  // Chart load on coin/timeframe change
  useEffect(() => {
    if (isReplayMode) {
      setChartData(replayCandles.map(c => ({
        time: Math.floor(c.openTime / 1000),
        open: c.openPrice,
        high: c.highPrice,
        low: c.lowPrice,
        close: c.closePrice,
        value: c.closePrice
      })));
      return;
    }
    
    if (!selected?.id) return;
    setChartLoading(true);
    const fetchDays = timeframe === 'now' ? '1' : timeframe;
    getMarketChart(selected.id, fetchDays)
      .then((data) => {
        let parsed = parseMarketChart(data);
        if (timeframe === 'now') {
          parsed = parsed.slice(-50); // Zoom in on the last 50 candles
        }
        setChartData(parsed);
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [selected?.id, timeframe, isReplayMode, replayCandles]);

  const baseList = tab === 'top50' ? top50 : tab === 'live' ? coins : top50.concat(coins);
  const list = query.trim()
    ? searchResults
    : tab === 'fav'
      ? baseList.filter((c) => watchlistIds.has(c.id))
      : baseList;

  const sortedList = useMemo(() => {
    const arr = [...(list || [])];
    if (sortKey === 'az') arr.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
    else if (sortKey === 'gainers') arr.sort((a, b) => (b.priceChangePercentage24h ?? -999) - (a.priceChangePercentage24h ?? -999));
    else if (sortKey === 'losers') arr.sort((a, b) => (a.priceChangePercentage24h ?? 999) - (b.priceChangePercentage24h ?? 999));
    else arr.sort((a, b) => (a.marketCapRank ?? 9999) - (b.marketCapRank ?? 9999));
    // de-dupe by id when tab === 'live' merges both lists
    const seen = new Set();
    return arr.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [list, sortKey]);

  const handleWatch = async (coin, e) => {
    e.stopPropagation();
    try {
      await addToWatchlist(coin.id);
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.has(coin.id) ? next.delete(coin.id) : next.add(coin.id);
        return next;
      });
    } catch (err) {
      push(err.friendlyMessage || 'Could not update watchlist.', 'error');
    }
  };

  const qty = parseFloat(quantity) || 0;
  const price = isReplayMode 
    ? (replayCandles.length ? replayCandles[replayCandles.length - 1].closePrice : 0)
    : (selected?.currentPrice || 0);
  const total = qty * price;
  const availableBalance = isReplayMode 
    ? (replayWallet?.balance != null ? Number(replayWallet.balance) : null)
    : (wallet?.balance != null ? Number(wallet.balance) : null);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (submittingRef.current || !selected) return;
    setFormError('');
    if (qty <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }
    submittingRef.current = true;
    setPlacing(true);
    try {
      if (isReplayMode) {
        await placeVirtualOrder({
          symbol: selected.symbol.toUpperCase(),
          quantity: qty,
          orderType: side,
          price: price
        });
      } else {
        await placeOrder({ coinId: selected.id, quantity: qty, orderType: side });
        push(`${side === 'BUY' ? 'Bought' : 'Sold'} ${qty} ${selected.symbol?.toUpperCase()}.`, 'success');
      }
      setQuantity('');
      if (!isReplayMode) {
        refreshUserData();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Order could not be placed.');
    } finally {
      submittingRef.current = false;
      setPlacing(false);
    }
  };

  const submitExchange = async (e) => {
    e.preventDefault();
    if (submittingRef.current || !fromCoin || !toCoin) return;
    setFormError('');
    const qty = parseFloat(exchangeQuantity) || 0;
    if (qty <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }
    const fromBalance = userAssets.find(a => a.coin?.id === fromCoin.id)?.quantity || 0;
    if (qty > fromBalance) {
      setFormError(`Insufficient balance. You own ${fromBalance} ${fromCoin.symbol.toUpperCase()}.`);
      return;
    }
    
    submittingRef.current = true;
    setExchanging(true);
    try {
      await exchangeAsset({
        fromCoinId: fromCoin.id,
        toCoinId: toCoin.id,
        quantity: qty
      });
      push(`Successfully exchanged ${qty} ${fromCoin.symbol.toUpperCase()} for ${(qty * fromCoin.currentPrice / toCoin.currentPrice).toFixed(6)} ${toCoin.symbol.toUpperCase()}`, 'success');
      setExchangeQuantity('');
      refreshUserData();
    } catch (err) {
      setFormError(err.friendlyMessage || 'Exchange could not be completed.');
    } finally {
      submittingRef.current = false;
      setExchanging(false);
    }
  };

  const up = (selected?.priceChangePercentage24h ?? 0) >= 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-surface-container-lowest text-on-surface antialiased overflow-hidden font-hanken">

      {/* Mobile navigation tab selector */}
      <div className="lg:hidden flex border-b border-outline-variant bg-surface shrink-0 z-30">
        <button
          type="button"
          onClick={() => setActiveMobileView('markets')}
          className={`flex-1 py-3 text-xs font-bold text-center border-r border-outline-variant transition-colors ${
            activeMobileView === 'markets' ? 'text-primary-container bg-surface-container-low border-b-2 border-b-primary-container' : 'text-muted-tertiary'
          }`}
        >
          Markets
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileView('chart')}
          className={`flex-1 py-3 text-xs font-bold text-center border-r border-outline-variant transition-colors ${
            activeMobileView === 'chart' ? 'text-primary-container bg-surface-container-low border-b-2 border-b-primary-container' : 'text-muted-tertiary'
          }`}
        >
          Chart
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileView('trade')}
          className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${
            activeMobileView === 'trade' ? 'text-primary-container bg-surface-container-low border-b-2 border-b-primary-container' : 'text-muted-tertiary'
          }`}
        >
          Trade
        </button>
      </div>

      {/* ===== Market list column ===== */}
      <div className={`w-full lg:w-[300px] shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col min-h-0 ${
        activeMobileView === 'markets' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="px-4 pt-4 pb-3 border-b border-outline-variant">
          <h1 className="font-hanken text-[17px] font-bold uppercase tracking-wider text-[#fff4d7] mb-3">Exchange</h1>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  tab === t.key ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-muted-strong hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2">
            {searching ? <Loader2 size={14} className="text-muted-strong animate-spin" /> : <Search size={14} className="text-muted-strong" />}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets…"
              className="flex-1 bg-transparent outline-none text-[12.5px] text-on-surface placeholder:text-muted-tertiary font-hanken"
            />
          </div>
        </div>

        <div className="relative flex items-center justify-between px-4 py-2 text-[11px] text-muted-strong border-b border-outline-variant">
          <span>Sorted by {SORTS.find((s) => s.key === sortKey)?.label}</span>
          <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1 hover:text-on-surface font-semibold">
            Sort <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-3 top-8 z-20 w-36 rounded-md border border-outline-variant bg-surface-card shadow-md overflow-hidden"
              >
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setSortKey(s.key); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-variant ${sortKey === s.key ? 'text-primary-container font-bold' : 'text-muted-tertiary'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-8 text-center text-xs text-muted-strong">Loading markets…</div>
          ) : sortedList?.length ? (
            sortedList.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  if (isReplayMode) {
                    exitReplayMode();
                  }
                  setActiveMobileView('chart');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-l-2 transition-colors ${
                  selected?.id === c.id ? 'bg-surface-container-low border-primary-container' : 'border-transparent hover:bg-surface-container-low/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    onClick={(e) => handleWatch(c, e)}
                    className={`shrink-0 ${watchlistIds.has(c.id) ? 'text-primary-container' : 'text-muted-strong hover:text-on-surface'}`}
                  >
                    <Star size={13} fill={watchlistIds.has(c.id) ? 'currentColor' : 'none'} />
                  </span>
                  {c.image && <img src={c.image} alt="" className="w-6 h-6 rounded-full shrink-0" />}
                  <div className="min-w-0 font-hanken">
                    <div className="text-[12.5px] font-bold truncate text-on-surface">{c.symbol?.toUpperCase()}/USDT</div>
                    <div className="text-[10.5px] text-muted-strong truncate">{c.name}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2 font-plex">
                  <div className="text-[12.5px] font-bold text-on-surface">
                    {c.currentPrice != null ? formatCurrency(c.currentPrice, 'USD', c.currentPrice < 1 ? 4 : 2) : '—'}
                  </div>
                  <div className={`text-[11px] font-bold ${(c.priceChangePercentage24h ?? 0) >= 0 ? 'text-secondary' : 'text-error'}`}>
                    {c.priceChangePercentage24h != null ? formatPercent(c.priceChangePercentage24h) : '—'}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted-strong font-hanken">
              {tab === 'fav' ? 'No favorites yet — tap the star on any market.' : 'No markets found.'}
            </div>
          )}
        </div>
      </div>

      {/* ===== Main column: chart + orders ===== */}
      <div className={`flex-1 min-w-0 flex flex-col border-r border-outline-variant ${
        activeMobileView === 'chart' ? 'flex' : 'hidden lg:flex'
      }`}>
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline-variant flex-wrap gap-3 font-hanken">
              <div className="flex items-center gap-3">
                {selected.image && <img src={selected.image} alt="" className="w-7 h-7 rounded-full" />}
                <span className="font-hanken text-lg font-bold text-[#fff4d7]">{selected.symbol?.toUpperCase()}/USDT</span>
                <span className={`font-plex text-lg font-bold ${up ? 'text-secondary' : 'text-error'}`}>
                  {formatCurrency(selected.currentPrice, 'USD', selected.currentPrice < 1 ? 4 : 2)}
                </span>
              </div>
              <div className="flex gap-6 text-[11px] text-muted-strong overflow-x-auto scrollbar-none py-1">
                <div className="shrink-0">24h Change<br /><b className={`font-plex ${up ? 'text-secondary' : 'text-error'}`}>{formatPercent(selected.priceChangePercentage24h ?? 0)}</b></div>
                <div className="shrink-0">24h High<br /><b className="font-plex text-on-surface font-semibold">{selected.high24h != null ? formatCurrency(selected.high24h) : '—'}</b></div>
                <div className="shrink-0">24h Low<br /><b className="font-plex text-on-surface font-semibold">{selected.low24h != null ? formatCurrency(selected.low24h) : '—'}</b></div>
                <div className="shrink-0">Market Cap<br /><b className="font-plex text-on-surface font-semibold">{selected.marketCap ? formatCurrency(selected.marketCap, 'USD', 0) : '—'}</b></div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-2.5 border-b border-outline-variant flex-wrap gap-2">
              {isReplayMode ? (
                <div className="flex items-center gap-3 w-full justify-between flex-wrap">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-primary-container bg-primary-container/10 border border-primary-container/20 px-2 py-1 rounded">REPLAY MODE</span>
                     <span className="text-xs text-muted-strong">{activeSession?.symbol}</span>
                   </div>
                   <div className="flex items-center gap-2 text-on-surface">
                     <button onClick={() => executeControl('skipBackward', 1)} className="p-1.5 hover:bg-surface-variant rounded"><SkipBack size={14}/></button>
                     {activeSession?.replayStatus === 'PLAYING' ? (
                       <button onClick={() => executeControl('pauseReplaySession')} className="p-1.5 hover:bg-surface-variant rounded text-primary-container"><Pause size={14}/></button>
                     ) : (
                       <button onClick={() => executeControl(activeSession?.replayStatus === 'PAUSED' ? 'resumeReplaySession' : 'startReplaySession')} className="p-1.5 hover:bg-surface-variant rounded text-primary-container"><Play size={14}/></button>
                     )}
                     <button onClick={() => executeControl('nextReplayCandle')} className="p-1.5 hover:bg-surface-variant rounded"><SkipForward size={14}/></button>
                     
                     <div className="w-px h-4 bg-outline-variant mx-1"/>
                     
                     <select onChange={(e) => executeControl('updateReplaySpeed', parseFloat(e.target.value))} value={activeSession?.replaySpeed || 1} className="bg-surface-container-low border border-outline-variant text-xs outline-none cursor-pointer text-muted-tertiary rounded px-1.5 py-0.5">
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={5}>5x</option>
                     </select>
                     
                     <button onClick={exitReplayMode} className="ml-2 px-2 py-1 bg-error/10 border border-error/20 text-error rounded text-[10px] uppercase font-bold hover:bg-error/20 transition-colors">Exit</button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf.key}
                        onClick={() => setTimeframe(tf.key)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold shrink-0 ${
                          timeframe === tf.key ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container-low border border-outline-variant text-muted-tertiary hover:text-on-surface hover:border-outline'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const isPremium = subscription && subscription.plan !== 'FREE';
                      if (isPremium || user?.role === 'ROLE_ADMIN') {
                        setReplayModalOpen(true);
                      } else {
                        setUpgradeModalOpen(true);
                      }
                    }} 
                    className="px-3 py-1.5 text-[11px] bg-surface-container-low border border-outline-variant rounded hover:border-primary-container transition-colors text-primary-container font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <FastForward size={13}/> Market Replay
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 min-h-[260px] p-4 relative">
              {chartLoading ? (
                <div className="w-full h-full flex items-center justify-center text-muted-strong text-xs font-hanken">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading chart…
                </div>
              ) : chartData.length ? (
                <InteractiveChart
                  data={chartData}
                  height={340}
                  defaultType="candlestick"
                  hideTimeRanges={true}
                  timeVisible={isReplayMode}
                  disableSimulation={isReplayMode}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-strong text-xs font-hanken">
                  No chart data available.
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant max-h-[220px] overflow-y-auto shrink-0 font-hanken">
              <div className="px-6 py-2.5 text-xs text-muted-tertiary border-b border-outline-variant font-bold">
                Orders ({(isReplayMode ? replayOrders : orders).length})
              </div>
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-muted-strong text-[10px] uppercase tracking-wider font-plex">
                    <th className="px-6 py-2 font-normal border-b border-outline-variant">Asset</th>
                    <th className="px-4 py-2 font-normal border-b border-outline-variant">Side</th>
                    <th className="px-4 py-2 font-normal border-b border-outline-variant">Amount</th>
                    <th className="px-4 py-2 font-normal border-b border-outline-variant">Price</th>
                    <th className="px-6 py-2 font-normal text-right border-b border-outline-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {(isReplayMode ? replayOrders : orders).length ? (
                    (isReplayMode ? replayOrders : orders).slice(0, 20).map((o) => (
                      <tr key={o.id} className="hover:bg-surface-variant/20 transition-colors">
                        <td className="px-6 py-2 font-plex font-semibold text-on-surface">{o.orderItem?.coin?.symbol?.toUpperCase() || (isReplayMode && selected ? selected.symbol.toUpperCase() : '—')}</td>
                        <td className={`px-4 py-2 font-bold ${o.orderType === 'BUY' ? 'text-secondary' : 'text-error'}`}>{o.orderType}</td>
                        <td className="px-4 py-2 font-plex text-muted-tertiary">{o.orderItem?.quantity ?? '—'}</td>
                        <td className="px-4 py-2 font-plex text-muted-tertiary">{o.price != null ? formatCurrency(o.price) : '—'}</td>
                        <td className="px-6 py-2 text-right text-muted-strong font-semibold">{o.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-6 text-center text-muted-strong">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-strong text-sm font-hanken">Select a market to begin.</div>
        )}
      </div>

      {/* ===== Order panel ===== */}
      <div className={`w-full lg:w-[300px] shrink-0 bg-surface-container-lowest border-l border-outline-variant p-4 flex flex-col overflow-y-auto ${
        activeMobileView === 'trade' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="grid grid-cols-3 rounded-md border border-outline-variant bg-surface-card p-1 mb-4">
          <button
            onClick={() => { setSide('BUY'); setFormError(''); }}
            className={`py-2 rounded text-xs font-button font-bold outline-none transition-colors flex items-center justify-center gap-1 ${
              side === 'BUY' ? 'bg-primary-container text-on-primary-container' : 'text-muted-tertiary hover:text-on-surface'
            }`}
          >
            <ArrowUpRight size={12} /> Buy
          </button>
          <button
            onClick={() => { setSide('SELL'); setFormError(''); }}
            className={`py-2 rounded text-xs font-button font-bold outline-none transition-colors flex items-center justify-center gap-1 ${
              side === 'SELL' ? 'bg-error text-white' : 'text-muted-tertiary hover:text-on-surface'
            }`}
          >
            <ArrowDownRight size={12} /> Sell
          </button>
          <button
            onClick={() => { setSide('EXCHANGE'); setFormError(''); }}
            className={`py-2 rounded text-xs font-button font-bold outline-none transition-colors flex items-center justify-center gap-1 ${
              side === 'EXCHANGE' ? 'bg-surface-elevated text-on-surface border border-outline-variant' : 'text-muted-tertiary hover:text-on-surface'
            }`}
          >
            <RefreshCw size={12} /> Exchange
          </button>
        </div>

        {side === 'EXCHANGE' ? (
          <form onSubmit={submitExchange} className="space-y-4 font-hanken">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex justify-between text-[11px] text-muted-strong mb-2">
                <span>From</span>
                <span className="font-plex font-semibold">
                  Balance: {(userAssets.find(a => a.coin?.id === fromCoin?.id)?.quantity || 0).toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-surface-elevated px-2 py-1 rounded border border-outline-variant">
                  {fromCoin?.image && <img src={fromCoin.image} alt="" className="w-4 h-4 rounded-full" />}
                  <select
                    value={fromCoin?.id || ''}
                    onChange={(e) => {
                      const c = coins.find(coin => coin.id === e.target.value) || top50.find(coin => coin.id === e.target.value);
                      if (c) setFromCoin(c);
                    }}
                    className="bg-transparent text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    {coins.concat(top50).filter((c, i, self) => self.findIndex(o => o.id === c.id) === i).map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-card text-on-surface">
                        {c.symbol?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={exchangeQuantity}
                  onChange={(e) => setExchangeQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-1/2 bg-transparent text-right outline-none text-sm font-plex text-on-surface placeholder:text-muted-tertiary"
                />
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={() => {
                  const temp = fromCoin;
                  setFromCoin(toCoin);
                  setToCoin(temp);
                }}
                className="w-8 h-8 rounded-full border border-outline-variant bg-surface-card text-primary-container flex items-center justify-center hover:border-primary-container transition-colors shadow-sm"
              >
                <ArrowLeftRight size={14} className="rotate-90" />
              </button>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex justify-between text-[11px] text-muted-strong mb-2">
                <span>To</span>
                <span className="font-plex font-semibold">
                  Balance: {(userAssets.find(a => a.coin?.id === toCoin?.id)?.quantity || 0).toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-surface-elevated px-2 py-1 rounded border border-outline-variant">
                  {toCoin?.image && <img src={toCoin.image} alt="" className="w-4 h-4 rounded-full" />}
                  <select
                    value={toCoin?.id || ''}
                    onChange={(e) => {
                      const c = coins.find(coin => coin.id === e.target.value) || top50.find(coin => coin.id === e.target.value);
                      if (c) setToCoin(c);
                    }}
                    className="bg-transparent text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    {coins.concat(top50).filter((c, i, self) => self.findIndex(o => o.id === c.id) === i).map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-card text-on-surface">
                        {c.symbol?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-right text-sm font-plex text-muted-tertiary">
                  {fromCoin && toCoin && exchangeQuantity
                    ? (parseFloat(exchangeQuantity) * fromCoin.currentPrice / toCoin.currentPrice).toFixed(6)
                    : '0.00'}
                </div>
              </div>
            </div>

            {fromCoin && toCoin && (
              <div className="text-[11px] text-muted-strong text-center font-plex">
                1 {fromCoin.symbol?.toUpperCase()} = {(fromCoin.currentPrice / toCoin.currentPrice).toFixed(6)} {toCoin.symbol?.toUpperCase()}
              </div>
            )}

            {formError && (
              <div className="text-xs text-error bg-error-container/10 border border-error/20 rounded-lg px-3 py-2 font-hanken">
                {formError}
              </div>
            )}

            {isReplayMode ? (
              <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 text-center font-hanken">
                Exchange is not supported in Market Replay mode.
              </div>
            ) : (
              <button
                type="submit"
                disabled={exchanging || !fromCoin || !toCoin}
                className="w-full flex items-center justify-center gap-2 rounded-md font-button font-bold text-sm py-3 transition-colors bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
              >
                {exchanging ? <Loader2 size={16} className="animate-spin" /> : 'Exchange Now'}
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={submitOrder} className="space-y-4 font-hanken">
            <div>
              <label className="text-[10.5px] uppercase tracking-wide text-muted-strong mb-1.5 block">Price</label>
              <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                <span className="font-plex text-sm text-on-surface font-semibold">{price ? formatCurrency(price, 'USD', price < 1 ? 4 : 2) : '—'}</span>
                <span className="text-[11px] text-muted-strong font-plex">USDT</span>
              </div>
            </div>

            <div>
              <label className="text-[10.5px] uppercase tracking-wide text-muted-strong mb-1.5 block">Amount</label>
              <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5 focus-within:border-primary-container">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00000"
                  className="flex-1 bg-transparent outline-none text-sm font-plex text-on-surface placeholder:text-muted-tertiary"
                />
                <span className="text-[11px] text-muted-strong font-plex">{selected?.symbol?.toUpperCase() || ''}</span>
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-muted-strong font-hanken">
              <span>Available</span>
              <b className="text-on-surface font-plex">{availableBalance != null ? formatCurrency(availableBalance) : '—'}</b>
            </div>

            <div className="rounded-md bg-surface-container-high border border-outline-variant px-3 py-2.5 flex justify-between text-sm">
              <span className="text-muted-strong">Estimated total</span>
              <span className="font-plex font-bold text-on-surface">{formatCurrency(total)}</span>
            </div>

            {formError && (
              <div className="text-xs text-error bg-error-container/10 border border-error/20 rounded px-3 py-2 font-hanken">{formError}</div>
            )}

            <button
              type="submit"
              disabled={placing || !selected}
              className={`w-full flex items-center justify-center gap-2 rounded-md font-button font-bold text-sm py-3 transition-colors disabled:opacity-60 ${
                side === 'BUY' ? 'bg-primary-container text-on-primary-container hover:bg-primary-active' : 'bg-error text-white hover:bg-error-active'
              }`}
            >
              {placing ? <Loader2 size={16} className="animate-spin" /> : `Place ${side === 'BUY' ? 'Buy' : 'Sell'} Order`}
            </button>
          </form>
        )}
      </div>

      {/* Replay Modal */}
      <AnimatePresence>
        {replayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0e11]/85 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-surface-card border border-outline-variant rounded-lg shadow-md overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0 font-hanken">
                <h3 className="font-bold text-lg text-on-surface">Market Replay</h3>
                <button onClick={() => setReplayModalOpen(false)} className="text-muted-tertiary hover:text-on-surface"><X size={18}/></button>
              </div>
              <div className="flex border-b border-outline-variant shrink-0 font-hanken">
                <button onClick={() => setReplayModalTab('new')} className={`flex-1 py-3 text-xs font-bold ${replayModalTab === 'new' ? 'text-primary-container border-b-2 border-b-primary-container bg-surface-container-low' : 'text-muted-tertiary hover:text-on-surface hover:bg-surface-container-low/50'}`}>New Session</button>
                <button onClick={() => setReplayModalTab('saved')} className={`flex-1 py-3 text-xs font-bold ${replayModalTab === 'saved' ? 'text-primary-container border-b-2 border-b-primary-container bg-surface-container-low' : 'text-muted-tertiary hover:text-on-surface hover:bg-surface-container-low/50'}`}>Saved Sessions</button>
              </div>
              
              <div className="p-6 overflow-y-auto font-hanken">
                {replayModalTab === 'new' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-muted-strong mb-1.5 block">Session Name</label>
                      <input type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 text-sm outline-none focus:border-primary-container text-on-surface font-plex placeholder:text-muted-tertiary" value={replayForm.name} onChange={e => setReplayForm(p => ({...p, name: e.target.value}))} placeholder="e.g. BTC 2021 Bull Run" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] uppercase tracking-wide text-muted-strong mb-1.5 block">Start Date</label>
                        <input type="date" className="w-full bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 text-sm outline-none focus:border-primary-container text-on-surface font-plex" value={replayForm.startTime} onChange={e => setReplayForm(p => ({...p, startTime: e.target.value}))} />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wide text-muted-strong mb-1.5 block">Timeframe</label>
                        <select className="w-full bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 text-sm outline-none focus:border-primary-container text-on-surface font-plex" value={replayForm.timeframe} onChange={e => setReplayForm(p => ({...p, timeframe: e.target.value}))}>
                          <option value="1m">1m</option>
                          <option value="5m">5m</option>
                          <option value="15m">15m</option>
                          <option value="1h">1h</option>
                          <option value="4h">4h</option>
                          <option value="1d">1d</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-muted-strong mb-1.5 block">Initial Virtual Balance (USDT)</label>
                      <input type="number" className="w-full bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 text-sm outline-none focus:border-primary-container text-on-surface font-plex" value={replayForm.initialBalance} onChange={e => setReplayForm(p => ({...p, initialBalance: e.target.value}))} />
                    </div>
                    <button 
                      onClick={async () => {
                        setLoadingReplay(true);
                        try {
                          const payload = {
                            name: replayForm.name || 'Quick Replay',
                            description: `Replay of ${selected?.symbol} on ${replayForm.timeframe}`,
                            symbol: selected?.symbol,
                            timeframe: replayForm.timeframe,
                            startTime: new Date(replayForm.startTime).getTime(),
                            endTime: Date.now(),
                            initialBalance: parseFloat(replayForm.initialBalance),
                            replaySpeed: 1
                          };
                          const { createReplaySession } = await import('../../api/replay');
                          const session = await createReplaySession(payload);
                          await loadSession(session);
                          setReplayModalOpen(false);
                        } catch (err) {
                          push('Failed to start replay', 'error');
                        } finally {
                          setLoadingReplay(false);
                        }
                      }}
                      disabled={loadingReplay || !replayForm.startTime}
                      className="w-full bg-primary-container text-on-primary-container font-button font-bold rounded-md py-3 text-sm hover:bg-primary-active transition-colors disabled:opacity-50 mt-2 shadow-sm"
                    >
                      {loadingReplay ? 'Starting...' : 'Start Virtual Trading'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replaySessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-strong text-sm">No saved sessions found.</div>
                    ) : (
                      replaySessions.map(session => (
                        <div key={session.id} className="bg-surface-container-low border border-outline-variant rounded-md p-3 flex items-center justify-between group hover:border-outline transition-colors">
                          <div className="min-w-0 pr-4">
                            <div className="font-bold text-sm truncate text-on-surface">{session.name}</div>
                            <div className="text-xs text-muted-strong mt-0.5 flex items-center gap-1.5 font-plex">
                              <span>{session.symbol}</span>
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                              <span>{session.timeframe}</span>
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                              <span className="flex items-center gap-1"><Clock size={10} /> {new Date(session.currentTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={async () => {
                                try {
                                  await loadSession(session);
                                  setReplayModalOpen(false);
                                } catch (e) {
                                  push('Failed to load session', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-primary-container/10 text-primary-container hover:bg-primary-container/20 rounded text-xs font-bold transition-colors"
                            >
                              Resume
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const { deleteReplaySession } = await import('../../api/replay');
                                  await deleteReplaySession(session.id);
                                  push('Session deleted', 'info');
                                  fetchSessions();
                                } catch (e) {
                                  push('Failed to delete', 'error');
                                }
                              }}
                              className="p-1.5 text-muted-strong hover:text-error hover:bg-error/10 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UpgradeModal 
        open={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        requiredPlan="PRO" 
        featureName="Market Replay & Paper Trading" 
      />
    </div>
  );
}
