import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Mail, Loader2, CheckCircle2, KeyRound, Smartphone, Pencil, Bell, Lock, MonitorSmartphone, Trash2, LogOut } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { sendVerificationOtp, verifyAccountOtp, enableTwoFactor, updateMobile, getNotificationPreferences, updateNotificationPreferences, updateWithdrawalPin, forgotWithdrawalPin, resetWithdrawalPin, changeWithdrawalPin } from '../../api/auth';
import { getActiveSessions, revokeSession } from '../../api/sessions';
import { useToast } from '../../context/ToastContext';

function OtpInline({ onSubmit, loading, onCancel }) {
  const [otp, setOtp] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(otp);
      }}
      className="flex items-center gap-2 mt-3"
    >
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        inputMode="numeric"
        maxLength={6}
        className="w-32 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="px-3.5 py-2 rounded-md bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-muted-strong hover:text-muted-tertiary">
        Cancel
      </button>
    </form>
  );
}

function MobileNumberCard({ mobile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(mobile || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { push } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!value.trim()) {
      setError('Enter a mobile number.');
      return;
    }
    setLoading(true);
    try {
      await updateMobile(value.trim());
      push('Mobile number updated.', 'success');
      onSaved(value.trim());
      setEditing(false);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not update mobile number.');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-card p-5 font-hanken">
        <div className="flex items-start gap-3 mb-3">
          <Smartphone size={16} className="text-muted-strong mt-0.5 shrink-0" />
          <div className="text-sm text-on-surface font-bold">Mobile number</div>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+1 555 123 4567"
            autoFocus
            className="flex-1 min-w-0 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-container placeholder:text-muted-tertiary"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-2 rounded-md bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(mobile || '');
              setError('');
            }}
            className="text-xs text-muted-strong hover:text-muted-tertiary shrink-0 font-bold"
          >
            Cancel
          </button>
        </form>
        {error && <p className="text-xs text-error mt-2 font-semibold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-card p-5 flex items-start gap-3 font-hanken">
      <Smartphone size={16} className="text-muted-strong mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-on-surface font-bold mb-0.5">Mobile number</div>
        <p className="text-xs text-muted-tertiary">{mobile || 'Not added yet'}</p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-muted-strong hover:text-on-surface p-1"
        aria-label="Edit mobile number"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

function WithdrawalPinCard() {
  const { user, refresh } = useAuth();
  const [resetStep, setResetStep] = useState('NORMAL'); // 'NORMAL' | 'FORGOT_OTP' | 'RESET_FORM' | 'CHANGE_PIN_FORM'
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const handleSet = async (e) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      push('PIN must be exactly 4 digits.', 'error'); return;
    }
    if (pin !== confirm) {
      push('PINs do not match.', 'error'); return;
    }
    setLoading(true);
    try {
      await updateWithdrawalPin(pin);
      push('Withdrawal PIN set successfully!', 'success');
      setPin('');
      setConfirm('');
      await refresh();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to set PIN.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      push('Current PIN must be exactly 4 digits.', 'error'); return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      push('New PIN must be exactly 4 digits.', 'error'); return;
    }
    if (pin !== confirm) {
      push('PINs do not match.', 'error'); return;
    }
    setLoading(true);
    try {
      await changeWithdrawalPin(currentPin, pin);
      push('Withdrawal PIN updated successfully!', 'success');
      setPin('');
      setConfirm('');
      setCurrentPin('');
      setResetStep('NORMAL');
      await refresh();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to update PIN.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setLoading(true);
    try {
      await forgotWithdrawalPin();
      push('Verification OTP sent to your registered email.', 'success');
      setResetStep('FORGOT_OTP');
    } catch (err) {
      push(err.friendlyMessage || 'Failed to request OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      push('Please enter a valid 6-digit OTP.', 'error');
      return;
    }
    setResetStep('RESET_FORM');
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      push('PIN must be exactly 4 digits.', 'error'); return;
    }
    if (pin !== confirm) {
      push('PINs do not match.', 'error'); return;
    }
    setLoading(true);
    try {
      await resetWithdrawalPin(otp, pin);
      push('Withdrawal PIN reset successfully!', 'success');
      setPin('');
      setConfirm('');
      setOtp('');
      setResetStep('NORMAL');
      await refresh();
    } catch (err) {
      push(err.friendlyMessage || 'Failed to reset PIN.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPinSet = !!user?.hasWithdrawalPin;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-card p-6 font-hanken">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-md bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
          <Lock size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-on-surface block">Withdrawal PIN</span>
            {isPinSet && (
              <span className="flex items-center gap-1 text-[11px] text-secondary bg-secondary/10 px-2.5 py-0.5 rounded border border-secondary/20 font-bold">
                <CheckCircle2 size={11} /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-tertiary mb-4">
            {isPinSet 
              ? 'Your account is secured with a withdrawal PIN. This PIN is required for all withdrawals.' 
              : 'Set a 4-digit PIN that will be required for every withdrawal request.'}
          </p>
          
          {resetStep === 'NORMAL' && (
            <div className="space-y-3">
              {isPinSet ? (
                <div className="flex flex-wrap gap-2.5 font-button font-bold">
                  <button
                    type="button"
                    onClick={() => setResetStep('CHANGE_PIN_FORM')}
                    className="px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-on-surface text-xs hover:bg-surface-variant transition-colors"
                  >
                    Change PIN
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary-container/10 border border-primary-container/20 text-primary-container text-xs hover:bg-primary-container/20 transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    Forgot PIN?
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSet} className="flex flex-col sm:flex-row gap-2 max-w-sm">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="New PIN"
                    className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                  />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Confirm PIN"
                    className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary-container/20 border border-primary-container/30 text-primary-container text-xs font-button font-bold hover:bg-primary-container/30 transition-colors disabled:opacity-60 inline-flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : 'Set PIN'}
                  </button>
                </form>
              )}
            </div>
          )}

          {resetStep === 'CHANGE_PIN_FORM' && (
            <form onSubmit={handleChangePin} className="space-y-3 max-w-sm">
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="Current PIN"
                className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="New PIN"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Confirm New PIN"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-md bg-primary-container/20 border border-primary-container/30 text-primary-container text-xs font-button font-bold hover:bg-primary-container/30 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Change PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('NORMAL');
                    setPin('');
                    setConfirm('');
                    setCurrentPin('');
                  }}
                  className="px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-on-surface text-xs font-button font-bold hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {resetStep === 'FORGOT_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-3 max-w-sm">
              <p className="text-xs text-muted-tertiary font-medium font-hanken">Enter the 6-digit OTP sent to your registered email to reset your PIN.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter OTP"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-primary-container/20 border border-primary-container/30 text-primary-container text-xs font-button font-bold hover:bg-primary-container/30 transition-colors disabled:opacity-60 inline-flex items-center gap-2 shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : 'Verify OTP'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetStep('NORMAL');
                  setOtp('');
                }}
                className="text-xs text-muted-strong hover:text-on-surface transition-colors font-bold block"
              >
                Cancel
              </button>
            </form>
          )}

          {resetStep === 'RESET_FORM' && (
            <form onSubmit={handleResetPin} className="space-y-3 max-w-sm">
              <p className="text-xs text-muted-tertiary font-medium font-hanken">Verification successful. Set your new 4-digit PIN.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="New PIN"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                  autoFocus
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Confirm PIN"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface font-plex outline-none focus:border-primary-container placeholder:text-muted-tertiary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-md bg-primary-container/20 border border-primary-container/30 text-primary-container text-xs font-button font-bold hover:bg-primary-container/30 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Reset PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('NORMAL');
                    setPin('');
                    setConfirm('');
                    setOtp('');
                  }}
                  className="px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-on-surface text-xs font-button font-bold hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveDevicesCard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    getActiveSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      push('Session revoked.', 'success');
    } catch {
      push('Could not revoke session.', 'error');
    }
  };

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-card p-6 font-hanken">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-md bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
          <MonitorSmartphone size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-on-surface block mb-1">Active Devices</span>
          <p className="text-xs text-muted-tertiary mb-4">These are your current active login sessions. Revoke any you don't recognise.</p>
          {loading ? (
            <div className="flex items-center py-4">
              <Loader2 className="animate-spin text-primary-container" size={18} />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-strong italic">No active sessions found.</p>
          ) : (
            <div className="space-y-2.5 max-w-lg">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-surface-container-low border border-outline-variant">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MonitorSmartphone size={14} className="text-muted-strong shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-on-surface font-bold truncate">{s.deviceInfo || 'Unknown Device'}</div>
                      <div className="text-[10px] text-muted-strong font-plex truncate">{s.ipAddress} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>
                  {s.current ? (
                    <span className="text-[10px] text-secondary font-bold shrink-0">Current</span>
                  ) : (
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="shrink-0 text-error/80 hover:text-error transition-colors p-1"
                      title="Revoke session"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Security() {
  const { user, refresh, setUser } = useAuth();
  const { push } = useToast();
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [sending2fa, setSending2fa] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    trading: true,
    wallet: true,
    security: true,
    replay: true,
    subscription: true,
    marketing: false
  });
  const [prefLoading, setPrefLoading] = useState(true);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await getNotificationPreferences();
        if (data) {
          setPreferences(data);
        }
      } catch (err) {
        console.error("Failed to load preferences", err);
      } finally {
        setPrefLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleTogglePref = async (key) => {
    if (key === 'security') return;
    const previousValue = preferences[key];
    const newPrefs = { ...preferences, [key]: !previousValue };
    // Optimistically update UI
    setPreferences(newPrefs);
    try {
      await updateNotificationPreferences(newPrefs);
      push('Notification preference updated.', 'success');
    } catch (err) {
      push('Failed to update preference.', 'error');
      setPreferences((prev) => ({ ...prev, [key]: previousValue }));
    }
  };

  const isEmailVerified = !!(user?.isVerified || user?.verified);
  const is2faEnabled = !!(user?.twoFactorAuth?.isEnabled || user?.twoFactorAuth?.enabled);

  const handleSendVerify = async () => {
    setSendingVerify(true);
    try {
      await sendVerificationOtp('EMAIL');
      setVerifyStep(true);
      push('Verification code sent to your email.', 'info');
    } catch (e) {
      push(e.friendlyMessage || 'Could not send code.', 'error');
    } finally {
      setSendingVerify(false);
    }
  };

  const handleVerify = async (otp) => {
    if (otp.length < 4) return;
    setVerifyLoading(true);
    try {
      const updatedUser = await verifyAccountOtp(otp);
      push('Email verified successfully.', 'success');
      setVerifyStep(false);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? { ...prev, isVerified: true, verified: true, status: 'VERIFIED' } : prev));
      }
      await refresh();
    } catch (e) {
      push(e.friendlyMessage || e.response?.data?.message || 'Invalid code.', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSend2fa = async () => {
    setSending2fa(true);
    try {
      await sendVerificationOtp('EMAIL');
      setTwoFaStep(true);
      push('Verification code sent to your email.', 'info');
    } catch (e) {
      push(e.friendlyMessage || 'Could not send code.', 'error');
    } finally {
      setSending2fa(false);
    }
  };

  const handleEnable2fa = async (otp) => {
    if (otp.length < 4) return;
    setTwoFaLoading(true);
    try {
      const updatedUser = await enableTwoFactor(otp);
      push('Two-factor authentication enabled.', 'success');
      setTwoFaStep(false);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? {
          ...prev,
          twoFactorAuth: {
            ...prev?.twoFactorAuth,
            isEnabled: true,
            enabled: true
          }
        } : prev));
      }
      await refresh();
    } catch (e) {
      push(e.friendlyMessage || 'Invalid code.', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };


  return (
    <div className="pb-16 font-hanken">
      <PageHeader eyebrow="Account" title="Security" description="Verify your identity and harden how you sign in." />

      <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-outline-variant bg-surface-card p-6 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-lg shrink-0 border border-outline-variant">
              {(user?.fullName || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-bold text-on-surface">{user?.fullName || 'Trader'}</div>
              <div className="text-sm text-muted-strong">{user?.email}</div>
              {user?.mobile && <div className="text-xs text-muted-tertiary mt-0.5 font-plex font-semibold">{user.mobile}</div>}
            </div>
          </motion.div>

          {/* Email verification - Hidden for Admin */}
          {user?.role !== 'ROLE_ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-lg border border-outline-variant bg-surface-card p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                  <Mail size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 font-hanken">
                    <span className="text-sm font-bold text-on-surface">Email verification</span>
                    {isEmailVerified && (
                      <span className="flex items-center gap-1 text-[11px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 font-bold">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-tertiary">Confirm ownership of {user?.email} to unlock full account access.</p>

                  {!isEmailVerified && !verifyStep && (
                    <button
                      onClick={handleSendVerify}
                      disabled={sendingVerify}
                      className="mt-3 px-4 py-2 rounded-md bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm"
                    >
                      {sendingVerify ? <Loader2 size={14} className="animate-spin" /> : 'Send verification code'}
                    </button>
                  )}
                  {verifyStep && (
                    <OtpInline onSubmit={handleVerify} loading={verifyLoading} onCancel={() => setVerifyStep(false)} />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2FA - Hidden for Admin */}
          {user?.role !== 'ROLE_ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-lg border border-outline-variant bg-surface-card p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0 border border-outline-variant">
                  <ShieldCheck size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-on-surface">Two-factor authentication</span>
                    {is2faEnabled && (
                      <span className="flex items-center gap-1 text-[11px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 font-bold">
                        <CheckCircle2 size={11} /> Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-tertiary">
                    Require a one-time email code on every sign-in, in addition to your password.
                  </p>

                  {!is2faEnabled && !twoFaStep && (
                    <button
                      onClick={handleSend2fa}
                      disabled={sending2fa}
                      className="mt-3 px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-primary-container text-xs font-button font-bold hover:bg-surface-variant transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm"
                    >
                      {sending2fa ? <Loader2 size={14} className="animate-spin" /> : 'Enable 2FA'}
                    </button>
                  )}
                  {twoFaStep && (
                    <OtpInline onSubmit={handleEnable2fa} loading={twoFaLoading} onCancel={() => setTwoFaStep(false)} />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Devices */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <ActiveDevicesCard />
          </motion.div>

          {/* Security Help & Best Practices Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-lg border border-outline-variant bg-surface-card p-6 space-y-4 font-hanken"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                <ShieldAlert size={17} />
              </div>
              <div>
                <span className="text-sm font-bold text-on-surface block">Security Help & Tips</span>
                <span className="text-[10px] text-muted-strong font-bold">Best practices for keeping your assets safe</span>
              </div>
            </div>

            <div className="space-y-3.5 divide-y divide-outline-variant/40">
              <div className="pt-0 flex gap-3">
                <div className="text-xs font-plex text-secondary mt-0.5 shrink-0 font-bold">01</div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface">Enable 2FA Protection</div>
                  <p className="text-[10px] text-muted-tertiary leading-relaxed mt-0.5 font-medium">Require an email OTP challenge in addition to your username and password upon signing in.</p>
                </div>
              </div>
              <div className="pt-3 flex gap-3">
                <div className="text-xs font-plex text-secondary mt-0.5 shrink-0 font-bold">02</div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface">Keep PIN Private</div>
                  <p className="text-[10px] text-muted-tertiary leading-relaxed mt-0.5 font-medium">Your 4-digit withdrawal PIN is encrypted. CryptoVault representatives will never ask you for your PIN.</p>
                </div>
              </div>
              <div className="pt-3 flex gap-3">
                <div className="text-xs font-plex text-secondary mt-0.5 shrink-0 font-bold">03</div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface">Audit Device Sessions</div>
                  <p className="text-[10px] text-muted-tertiary leading-relaxed mt-0.5 font-medium">Regularly check the active devices list. If you see an unrecognized location or device, revoke access immediately.</p>
                </div>
              </div>
              <div className="pt-3 flex gap-3">
                <div className="text-xs font-plex text-secondary mt-0.5 shrink-0 font-bold">04</div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface">Beware of Phishing</div>
                  <p className="text-[10px] text-muted-tertiary leading-relaxed mt-0.5 font-medium">Always verify the browser URL is the official site before typing your credentials. We will never ask for passwords via email.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-lg border border-outline-variant bg-surface-card p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0 border border-outline-variant">
                <Bell size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-on-surface block mb-1">Email Notifications</span>
                <p className="text-sm text-muted-tertiary mb-4">
                  Choose the emails you want to receive. Security notifications cannot be disabled.
                </p>

                {prefLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-primary-container" size={18} />
                  </div>
                ) : (
                  <div className="space-y-3.5 w-full">
                    {[
                      { key: 'trading', label: 'Trading Notifications', desc: 'Alerts on buy, sell and limit orders.' },
                      { key: 'wallet', label: 'Wallet Transactions', desc: 'Updates on deposits, withdrawals and transfers.' },
                      { key: 'replay', label: 'Replay Session Summary', desc: 'Summaries and outcomes of market replay sessions.' },
                      { key: 'subscription', label: 'Subscription & Billings', desc: 'Inconfirmations and billing history.' },
                      { key: 'marketing', label: 'Marketing Emails', desc: 'Exclusive offers, updates and digests.' },
                      { key: 'security', label: 'Security & Auth (Required)', desc: 'Password resets, device logins, and 2FA.', required: true }
                    ].map(({ key, label, desc, required }) => (
                      <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-md bg-surface-container-low border border-outline-variant">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-on-surface block">{label}</span>
                          <span className="text-[10px] text-muted-strong font-semibold">{desc}</span>
                        </div>
                        <button
                          type="button"
                          disabled={required}
                          onClick={() => handleTogglePref(key)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences[key] ? 'bg-secondary' : 'bg-surface-elevated border border-outline-variant'
                          } ${required ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferences[key] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Info cards */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <div className="rounded-lg border border-outline-variant bg-surface-card p-5 flex items-start gap-3">
              <KeyRound size={16} className="text-muted-strong mt-0.5 shrink-0" />
              <div>
                <div className="text-sm text-on-surface font-bold mb-0.5">Password</div>
                <p className="text-xs text-muted-tertiary">Reset it any time from the sign-in screen's forgot flow.</p>
              </div>
            </div>
            <MobileNumberCard
              mobile={user?.mobile}
              onSaved={(mobile) => setUser((prev) => (prev ? { ...prev, mobile } : prev))}
            />
          </motion.div>

          {/* Withdrawal PIN */}
          {user?.role !== 'ROLE_ADMIN' && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
              <WithdrawalPinCard />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
