import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Mail, Loader2, CheckCircle2, KeyRound, Smartphone, Pencil, Bell, Lock, MonitorSmartphone, Trash2, LogOut, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { sendVerificationOtp, verifyAccountOtp, enableTwoFactor, updateMobile, getNotificationPreferences, updateNotificationPreferences, updateWithdrawalPin, forgotWithdrawalPin, resetWithdrawalPin, changeWithdrawalPin, deleteAccount, requestDeleteAccountOtp } from '../../api/auth';
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
    const cleanValue = value.trim();
    if (!cleanValue) {
      setError('Enter a mobile number.');
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(cleanValue)) {
      setError('Invalid mobile number format. Please enter a valid number (e.g., +917321015054 or 7321015054).');
      return;
    }
    setLoading(true);
    try {
      await updateMobile(cleanValue);
      push('Mobile number updated.', 'success');
      onSaved(cleanValue);
      setEditing(false);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || 'Could not update mobile number.');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-surface-card rounded-xl p-4 border border-surface-container-highest font-hanken">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone size={16} className="text-muted-strong shrink-0" />
          <div className="text-[11px] font-bold text-muted-strong">Mobile number</div>
        </div>
        <form onSubmit={submit} className="flex items-center gap-1.5">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+1 555 123 4567"
            autoFocus
            className="flex-1 min-w-0 rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary-container placeholder:text-muted-tertiary"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-2.5 py-1.5 rounded-md bg-primary-container text-on-primary-container text-[11px] font-button font-bold hover:bg-primary-active transition-colors disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(mobile || '');
              setError('');
            }}
            className="text-[11px] text-muted-strong hover:text-muted-tertiary shrink-0 font-bold px-1"
          >
            Cancel
          </button>
        </form>
        {error && <p className="text-[10px] text-error mt-1.5 font-semibold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl p-4 border border-surface-container-highest flex items-center gap-3 font-hanken">
      <Smartphone size={18} className="text-muted-strong shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-muted-strong truncate">Mobile number</p>
        <p className="font-mono text-[10px] text-muted-tertiary truncate">{mobile || 'Not added yet'}</p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-muted-strong hover:text-on-surface p-1 transition-colors"
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
    <div className="bg-surface-container rounded-lg p-6 border border-on-surface/10 space-y-6 flex-1 font-hanken">
      <div className="flex items-start gap-4">
        <div className="bg-surface-container-highest p-3 rounded-lg text-primary-active shrink-0">
          <Lock size={18} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-on-surface">Withdrawal PIN</h4>
            {isPinSet && (
              <span className="px-2 py-[2px] bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary uppercase flex items-center gap-1">
                <CheckCircle2 size={12} className="fill-secondary/10" /> Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-strong font-medium mt-1">
            {isPinSet 
              ? 'Your account is secured with a withdrawal PIN. This PIN is required for all withdrawals.' 
              : 'Set a 4-digit PIN that will be required for every withdrawal request.'}
          </p>
        </div>
      </div>
      
      {resetStep === 'NORMAL' && (
        <div className="space-y-3">
          {isPinSet ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setResetStep('CHANGE_PIN_FORM')}
                className="flex-1 bg-surface-container-highest text-on-surface px-4 py-2.5 rounded font-button text-xs font-bold hover:bg-surface-bright transition-all border border-outline-variant"
              >
                Change PIN
              </button>
              <button
                type="button"
                onClick={handleForgotPin}
                disabled={loading}
                className="flex-1 bg-primary-container/10 text-primary-container border border-primary-container/20 px-4 py-2.5 rounded font-button text-xs font-bold hover:bg-primary-container hover:text-on-primary transition-all inline-flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                Forgot PIN?
              </button>
            </div>
          ) : (
            <form onSubmit={handleSet} className="flex gap-2 w-full">
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
        <form onSubmit={handleChangePin} className="space-y-3 w-full">
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
        <form onSubmit={handleVerifyOtp} className="space-y-3 w-full">
          <p className="text-xs text-muted-tertiary font-medium">Enter the 6-digit OTP sent to your registered email to reset your PIN.</p>
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
        <form onSubmit={handleResetPin} className="space-y-3 w-full">
          <p className="text-xs text-muted-tertiary font-medium">Verification successful. Set your new 4-digit PIN.</p>
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
    <div className="bg-surface-container rounded-lg p-6 border border-on-surface/10 font-hanken">
      <div className="flex items-start gap-4">
        <div className="bg-surface-container-highest p-3 rounded-lg text-info shrink-0">
          <MonitorSmartphone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-on-surface block mb-1">Active Devices</span>
          <p className="text-xs text-muted-strong font-medium mb-4">These are your current active login sessions. Revoke any you don't recognise.</p>
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
  const { user, refresh, setUser, logout } = useAuth();
  const { push } = useToast();
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteStep, setDeleteStep] = useState('CONFIRM'); // 'CONFIRM' | 'OTP'
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleRequestDeleteOtp = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await requestDeleteAccountOtp();
      push('Verification OTP sent to your registered email.', 'success');
      setDeleteStep('OTP');
    } catch (err) {
      setDeleteError(err.friendlyMessage || err.response?.data?.message || 'Failed to request verification code.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOtp || deleteOtp.length < 6) {
      setDeleteError('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount(deleteOtp);
      push('Your account has been permanently deleted.', 'info');
      logout();
    } catch (err) {
      setDeleteError(err.friendlyMessage || err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
      <header className="mb-6 px-4 sm:px-8 font-hanken">
        <span className="text-[10px] uppercase font-bold text-secondary-fixed tracking-wider">Account</span>
        <h1 className="text-display-md font-bold text-on-surface mt-1">Security</h1>
        <p className="text-sm text-muted-strong font-medium mt-1">Verify your identity and harden how you sign in.</p>
      </header>

      <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Profile card */}
          <div className="bg-surface-container rounded-lg p-6 border border-on-surface/10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary-active font-bold text-2xl shrink-0">
              {(user?.fullName || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-on-surface">{user?.fullName || 'Trader'}</h3>
              <p className="text-sm text-muted-strong mt-0.5">{user?.email}</p>
              {user?.mobile && <p className="font-mono text-xs text-muted-strong tracking-wider mt-0.5">{user.mobile}</p>}
            </div>
          </div>

          <div className="space-y-6">
            {/* Email verification - Hidden for Admin */}
            {user?.role !== 'ROLE_ADMIN' && (
              <div className="bg-surface-container rounded-lg p-6 border border-on-surface/10 flex items-start gap-4">
                <div className="bg-surface-container-highest p-3 rounded-lg text-secondary shrink-0">
                  <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-on-surface">Email verification</h4>
                    {isEmailVerified && (
                      <span className="px-2 py-[2px] bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} className="fill-secondary/10" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-strong font-medium">Confirm ownership of {user?.email} to unlock full account access.</p>

                  {!isEmailVerified && !verifyStep && (
                    <button
                      onClick={handleSendVerify}
                      disabled={sendingVerify}
                      className="mt-3.5 px-4 py-2 rounded-md bg-primary-container text-on-primary-container text-xs font-button font-bold hover:bg-primary-active transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm"
                    >
                      {sendingVerify ? <Loader2 size={14} className="animate-spin" /> : 'Send verification code'}
                    </button>
                  )}
                  {verifyStep && (
                    <OtpInline onSubmit={handleVerify} loading={verifyLoading} onCancel={() => setVerifyStep(false)} />
                  )}
                </div>
              </div>
            )}

            {/* 2FA - Hidden for Admin */}
            {user?.role !== 'ROLE_ADMIN' && (
              <div className="bg-surface-container rounded-lg p-6 border border-on-surface/10 flex items-start gap-4">
                <div className="bg-surface-container-highest p-3 rounded-lg text-primary-active shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-on-surface">Two-factor authentication</h4>
                    {is2faEnabled && (
                      <span className="px-2 py-[2px] bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} className="fill-secondary/10" /> Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-strong font-medium">
                    Require a one-time email code on every sign-in, in addition to your password.
                  </p>

                  {!is2faEnabled && !twoFaStep && (
                    <button
                      onClick={handleSend2fa}
                      disabled={sending2fa}
                      className="mt-3.5 px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-primary-container text-xs font-button font-bold hover:bg-surface-variant transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm"
                    >
                      {sending2fa ? <Loader2 size={14} className="animate-spin" /> : 'Enable 2FA'}
                    </button>
                  )}
                  {twoFaStep && (
                    <OtpInline onSubmit={handleEnable2fa} loading={twoFaLoading} onCancel={() => setTwoFaStep(false)} />
                  )}
                </div>
              </div>
            )}

            {/* Active Devices */}
            <ActiveDevicesCard />
          </div>

          {/* Security Help & Best Practices Card */}
          <div className="rounded-lg border border-on-surface/10 bg-surface-container p-6 space-y-6 font-hanken">
            <div className="flex items-center gap-3">
              <div className="bg-surface-container-highest p-2 rounded text-secondary-fixed shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Security Help & Tips</h3>
                <span className="text-[10px] text-muted-strong font-bold mt-0.5 block">Best practices for keeping your assets safe</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 py-2 border-b border-on-surface/5">
                <span className="font-mono text-sm text-secondary font-bold shrink-0 mt-0.5">01</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">Enable 2FA Protection</p>
                  <p className="text-[11px] text-muted-strong mt-0.5">Require an email OTP challenge in addition to your username and password upon signing in.</p>
                </div>
              </div>
              <div className="flex gap-4 py-2 border-b border-on-surface/5">
                <span className="font-mono text-sm text-secondary font-bold shrink-0 mt-0.5">02</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">Keep PIN Private</p>
                  <p className="text-[11px] text-muted-strong mt-0.5">Your 4 digit withdrawal PIN is encrypted. CryptoVault representatives will never ask you for your PIN.</p>
                </div>
              </div>
              <div className="flex gap-4 py-2">
                <span className="font-mono text-sm text-secondary font-bold shrink-0 mt-0.5">03</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">Audit Device Sessions</p>
                  <p className="text-[11px] text-muted-strong mt-0.5">Regularly check the active devices list. If you see an unrecognized location or device, revoke access immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-6 flex flex-col h-full">
          {/* Notification Preferences */}
          <div className="bg-surface-card rounded-xl p-6 border border-surface-container-highest font-hanken">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-surface-elevated p-2 rounded-lg text-secondary-fixed shrink-0">
                <Bell size={18} className="text-secondary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-on-surface">Email Notifications</h4>
                <p className="text-[11px] text-muted-strong mt-0.5">Choose the emails you want to receive. Security notifications cannot be disabled.</p>
              </div>
            </div>

            {prefLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-primary-container" size={18} />
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {[
                  { key: 'trading', label: 'Trading Notifications', desc: 'Alerts on buy, sell and limit orders.' },
                  { key: 'wallet', label: 'Wallet Transactions', desc: 'Updates on deposits, withdrawals and transfers.' },
                  { key: 'replay', label: 'Replay Session Summary', desc: 'Summaries and outcomes of market replay sessions.' },
                  { key: 'subscription', label: 'Subscription & Billings', desc: 'Inconfirmations and billing history.' },
                  { key: 'marketing', label: 'Marketing Emails', desc: 'Exclusive offers, updates and digests.' },
                  { key: 'security', label: 'Security & Auth (Required)', desc: 'Password resets, device logins, and 2FA.', required: true }
                ].map(({ key, label, desc, required }) => (
                  <div key={key} className={`flex items-center justify-between gap-4 py-3 border-b border-surface-container-highest ${key === 'security' ? 'opacity-65 border-b-0 pt-4' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-on-surface block">{label}</span>
                      <span className="text-[11px] text-muted-strong font-medium mt-0.5">{desc}</span>
                    </div>
                    <button
                      type="button"
                      disabled={required}
                      onClick={() => handleTogglePref(key)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        preferences[key] ? 'bg-[#00c77e]' : 'bg-surface-container-highest border border-outline-variant'
                      } ${required ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences[key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-card rounded-xl p-4 border border-surface-container-highest flex items-center gap-3">
              <KeyRound size={16} className="text-muted-strong shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-muted-strong truncate">Password</p>
                <p className="text-[10px] text-muted-tertiary mt-0.5">Reset any time</p>
              </div>
              <ChevronRight size={14} className="text-muted-strong shrink-0" />
            </div>

            <MobileNumberCard
              mobile={user?.mobile}
              onSaved={(mobile) => setUser((prev) => (prev ? { ...prev, mobile } : prev))}
            />
          </div>

          {/* Withdrawal PIN */}
          {user?.role !== 'ROLE_ADMIN' && (
            <WithdrawalPinCard />
          )}

        </div>

        {/* Danger Zone */}
        <div className="lg:col-span-12 flex justify-center mt-8 pb-4">
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="bg-error/10 text-error border border-error/20 px-6 py-2.5 rounded font-button text-xs font-bold hover:bg-error hover:text-white transition-all shrink-0 shadow-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirm Account Deletion Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0e11]/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-card border border-outline-variant rounded-lg shadow-md overflow-hidden flex flex-col font-hanken">
            <div className="px-6 py-4 border-b border-outline-variant shrink-0">
              <h3 className="font-bold text-lg text-error">
                {deleteStep === 'CONFIRM' ? 'Delete Account Request' : 'Verify Account Deletion OTP'}
              </h3>
            </div>
            
            {deleteStep === 'CONFIRM' ? (
              <div className="p-6 space-y-4 font-medium">
                <p className="text-sm text-on-surface">
                  Are you sure you want to permanently delete your CryptoVault account? This will erase all your wallets, assets, transaction logs, and profile data. <strong>This action cannot be undone.</strong>
                </p>
                <div>
                  <label className="text-xs text-muted-strong mb-1.5 block font-bold">Please type <span className="text-error font-mono font-bold">DELETE</span> to confirm:</label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:border-error/50 font-bold placeholder:text-muted-tertiary"
                    autoFocus
                  />
                </div>
                {deleteError && (
                  <div className="text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                    {deleteError}
                  </div>
                )}
                <div className="pt-2 flex justify-end gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setConfirmDeleteOpen(false);
                      setDeleteInput('');
                      setDeleteError('');
                    }}
                    disabled={deleteLoading}
                    className="px-4 py-2 rounded-md border border-outline-variant bg-surface-card text-on-surface text-xs font-button font-bold hover:bg-surface-variant transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestDeleteOtp}
                    disabled={deleteInput !== 'DELETE' || deleteLoading}
                    className="px-4 py-2 rounded-md bg-error text-white text-xs font-button font-bold hover:bg-error-active transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {deleteLoading && <Loader2 size={13} className="animate-spin" />}
                    Send Deletion OTP
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4 font-medium">
                <p className="text-sm text-on-surface">
                  A 6-digit verification code has been sent to your email to authorize the deletion of your account.
                </p>
                <div>
                  <label className="text-xs text-muted-strong mb-1.5 block font-bold">Email OTP</label>
                  <input
                    type="text"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface font-plex outline-none focus:border-error/50 transition-colors text-center tracking-widest text-lg font-bold placeholder:text-muted-tertiary"
                    autoFocus
                  />
                </div>
                {deleteError && (
                  <div className="text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                    {deleteError}
                  </div>
                )}
                <div className="pt-2 flex justify-end gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setDeleteStep('CONFIRM');
                      setDeleteOtp('');
                      setDeleteError('');
                    }}
                    disabled={deleteLoading}
                    className="px-4 py-2 rounded-md border border-outline-variant bg-surface-card text-on-surface text-xs font-button font-bold hover:bg-surface-variant transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteOtp.length !== 6 || deleteLoading}
                    className="px-4 py-2 rounded-md bg-error text-white text-xs font-button font-bold hover:bg-error-active transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {deleteLoading && <Loader2 size={13} className="animate-spin" />}
                    Permanently Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
