import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ open, onClose, requiredPlan = 'PRO', featureName = 'This feature' }) {
  const navigate = useNavigate();

  if (!open) return null;

  const isElite = requiredPlan === 'ELITE';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-void-900 shadow-panel overflow-hidden p-6"
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mt-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              isElite 
                ? 'bg-gradient-to-br from-violet to-fuchsia text-white shadow-lg shadow-violet/20' 
                : 'bg-gradient-to-br from-mint to-teal-400 text-void shadow-lg shadow-mint/20'
            }`}>
              {isElite ? <Crown size={24} /> : <Sparkles size={24} />}
            </div>
            
            <h3 className="font-display text-lg font-bold text-ink">
              Upgrade to {isElite ? 'Elite' : 'Pro'} Required
            </h3>
            
            <p className="text-sm text-ink-muted mt-2 max-w-xs">
              {featureName} is a premium feature available on the <span className={`font-semibold ${isElite ? 'text-violet-400' : 'text-mint'}`}>{isElite ? 'Elite' : 'Pro'}</span> plan.
            </p>
          </div>

          {/* Features List */}
          <div className="bg-void-950/65 rounded-xl p-4 my-6 border border-white/[0.03] space-y-3">
            <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
              What you will unlock:
            </div>
            {isElite ? (
              <>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-violet-400 shrink-0" />
                  <span>Advanced Replay Analytics (Equity Curve, Max Drawdown)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-violet-400 shrink-0" />
                  <span>AI Portfolio Review & Strategy Suggestions</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-violet-400 shrink-0" />
                  <span>Export options (CSV/PDF) & API Access</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-mint shrink-0" />
                  <span>Unlimited Market Replay & Paper Trading</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-mint shrink-0" />
                  <span>AI Chatbot (Unlimited access) & Trade Analysis</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <Shield size={14} className="text-mint shrink-0" />
                  <span>Replay Analytics & Trading Journal</span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/app/subscription');
              }}
              className={`w-full py-3.5 rounded-xl font-display font-semibold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-md ${
                isElite 
                  ? 'bg-gradient-to-r from-violet to-fuchsia hover:from-violet-400 hover:to-fuchsia-400 text-white' 
                  : 'bg-mint hover:bg-mint-400 text-void'
              }`}
            >
              <span>View Subscription Plans</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl border border-white/10 text-ink-muted hover:bg-white/[0.04] text-xs font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
