import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Newspaper, AlertTriangle, Compass, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAiPortfolioReview, getAiStrategyBuilder, getAiNewsSummary } from '../../api/ai';
import { getUserAssets } from '../../api/trading';
import { useToast } from '../../context/ToastContext';

export default function AiAssistants() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState('portfolio');

  // Portfolio Review State
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState('');
  const [userAssets, setUserAssets] = useState([]);

  // Strategy Builder State
  const [budget, setBudget] = useState(500);
  const [risk, setRisk] = useState('Low');
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState('');

  // News State
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsResult, setNewsResult] = useState('');

  useEffect(() => {
    // Fetch assets to have a real payload for portfolio review
    getUserAssets()
      .then(setUserAssets)
      .catch((err) => console.error('Failed to load portfolio assets', err));
  }, []);

  const handlePortfolioReview = async () => {
    setReviewLoading(true);
    try {
      const summaryStr = userAssets.length > 0
        ? userAssets.map((a) => `${a.coin.name}: ${a.quantity} units (Buy price: $${a.buyPrice})`).join(', ')
        : 'Portfolio is currently empty. No holdings found.';
      
      const res = await getAiPortfolioReview(summaryStr);
      setReviewResult(res.message);
      push('AI Portfolio audit generated successfully!', 'success');
    } catch (e) {
      push('Failed to generate portfolio review.', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleStrategyBuilder = async (e) => {
    e.preventDefault();
    setStrategyLoading(true);
    try {
      const res = await getAiStrategyBuilder(budget, risk);
      setStrategyResult(res.message);
      push('AI Strategy generated successfully!', 'success');
    } catch (e) {
      push('Failed to generate investment strategy.', 'error');
    } finally {
      setStrategyLoading(false);
    }
  };

  const handleNewsSummary = async () => {
    setNewsLoading(true);
    try {
      const res = await getAiNewsSummary();
      setNewsResult(res.message);
      push('Market news summarized successfully!', 'success');
    } catch (e) {
      push('Failed to fetch news summary.', 'error');
    } finally {
      setNewsLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-hanken">
      <PageHeader
        title="AI Assistants"
        description="Leverage institutional-grade intelligence to audit portfolios, design low-risk strategies, and summarize market updates."
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-container-low border border-outline-variant rounded-lg w-fit">
        {[
          { id: 'portfolio', label: 'Portfolio Review', icon: Brain },
          { id: 'strategy', label: 'Strategy Builder', icon: Compass },
          { id: 'news', label: 'News Summary', icon: Newspaper }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-muted-strong hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Control Card */}
        <div className="lg:col-span-1 rounded-lg border border-outline-variant bg-surface-card p-6 space-y-6 h-fit">
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Brain className="text-primary-container" size={20} />
                <h3 className="text-sm font-bold text-on-surface">AI Portfolio Review</h3>
              </div>
              <p className="text-xs text-muted-tertiary leading-relaxed font-medium">
                Our intelligence engine audits allocation dispersion, concentration risk, and suggests alignment offsets.
              </p>
              
              <div className="p-3.5 rounded bg-surface-container-low border border-outline-variant space-y-2">
                <div className="text-[10px] text-muted-strong uppercase font-bold tracking-wider">Active Assets ({userAssets.length})</div>
                {userAssets.length === 0 ? (
                  <div className="text-xs text-muted-tertiary font-medium">No holdings found to review. Try buying some coins first!</div>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {userAssets.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs text-muted-tertiary font-medium">
                        <span>{a.coin.name}</span>
                        <span className="font-plex text-[11px] text-on-surface font-bold">{a.quantity.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handlePortfolioReview}
                disabled={reviewLoading}
                className="w-full py-3 rounded bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {reviewLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-on-primary-container" />
                    <span>Analyzing Portfolio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Run Review</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'strategy' && (
            <form onSubmit={handleStrategyBuilder} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Compass className="text-primary-container" size={20} />
                <h3 className="text-sm font-bold text-on-surface">AI Strategy Builder</h3>
              </div>
              <p className="text-xs text-muted-tertiary leading-relaxed font-medium">
                Generate customized simulated allocation suggestions based on target budget sizes and risk tiers.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-strong uppercase font-bold tracking-wider block mb-1">Target Budget (USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min={10}
                    className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 text-xs text-on-surface font-plex outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-strong uppercase font-bold tracking-wider block mb-1">Risk Profile</label>
                  <select
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 text-xs text-on-surface font-plex outline-none focus:border-primary-container"
                  >
                    <option value="Low">Low Risk (Conservative)</option>
                    <option value="Medium">Medium Risk (Balanced)</option>
                    <option value="High">High Risk (Aggressive)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={strategyLoading}
                className="w-full py-3 rounded bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {strategyLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-on-primary-container" />
                    <span>Building Allocation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Strategy</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Newspaper className="text-primary-container" size={20} />
                <h3 className="text-sm font-bold text-on-surface">AI News Summarizer</h3>
              </div>
              <p className="text-xs text-muted-tertiary leading-relaxed font-medium">
                Fetches current market signals and compiles bulleted summaries of top news.
              </p>

              <button
                onClick={handleNewsSummary}
                disabled={newsLoading}
                className="w-full py-3 rounded bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {newsLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-on-primary-container" />
                    <span>Summarizing Updates...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Summarize News</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Output Window */}
        <div className="lg:col-span-2 rounded-lg border border-outline-variant bg-surface-card p-6 flex flex-col min-h-[300px]">
          <div className="text-[10px] text-muted-strong uppercase font-bold tracking-wider mb-3">Response Window</div>
          
          <div className="flex-1 rounded border border-outline-variant bg-surface-container-low p-5 font-plex text-xs text-on-surface leading-relaxed whitespace-pre-line overflow-y-auto">
            {activeTab === 'portfolio' && (
              reviewLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                  <Loader2 className="animate-spin text-primary-container" size={24} />
                  <span className="text-xs text-muted-strong font-hanken font-bold">Running deep portfolio risk audit...</span>
                </div>
              ) : reviewResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-500 font-hanken font-bold text-sm bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-2 rounded w-fit">
                    <AlertTriangle size={15} />
                    <span>Risk: Medium</span>
                  </div>
                  <div className="font-plex text-xs text-muted-strong">{reviewResult}</div>
                </div>
              ) : (
                <div className="text-muted-tertiary italic flex items-center justify-center h-full font-hanken font-bold">
                  Click "Run Review" to initialize portfolio auditing.
                </div>
              )
            )}

            {activeTab === 'strategy' && (
              strategyLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                  <Loader2 className="animate-spin text-primary-container" size={24} />
                  <span className="text-xs text-muted-strong font-hanken font-bold">Formulating low-risk strategy weights...</span>
                </div>
              ) : strategyResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-secondary font-hanken font-bold text-sm bg-secondary/10 border border-secondary/20 px-3.5 py-2 rounded w-fit">
                    <CheckCircle2 size={15} />
                    <span>Low-Risk Allocation Suggested</span>
                  </div>
                  <div className="font-plex text-xs text-muted-strong">{strategyResult}</div>
                </div>
              ) : (
                <div className="text-muted-tertiary italic flex items-center justify-center h-full font-hanken font-bold">
                  Select parameters and click "Generate Strategy" to build weights.
                </div>
              )
            )}

            {activeTab === 'news' && (
              newsLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                  <Loader2 className="animate-spin text-primary-container" size={24} />
                  <span className="text-xs text-muted-strong font-hanken font-bold">Fetching and compiling today's highlights...</span>
                </div>
              ) : newsResult ? (
                <div className="space-y-3 font-plex text-xs text-muted-strong">
                  <div className="font-hanken font-bold text-on-surface mb-1.5">Today's Crypto Highlights:</div>
                  {newsResult}
                </div>
              ) : (
                <div className="text-muted-tertiary italic flex items-center justify-center h-full font-hanken font-bold">
                  Click "Summarize News" to read synthesized bullet updates.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
