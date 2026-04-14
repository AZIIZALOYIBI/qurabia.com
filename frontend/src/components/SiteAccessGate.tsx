import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ACCESS_CODE = import.meta.env.VITE_SITE_ACCESS_CODE as string | undefined;
const STORAGE_KEY = 'qurabia.siteAccess';
const SENTINEL = 'OPEN'; // يُستخدم حين لا يوجد رمز وصول مضبوط
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 دقائق

function isUnlocked(code: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!code) return !!stored; // الموقع مفتوح → أي قيمة تُعتبر مصرحة
    return stored === code;
  } catch {
    return false;
  }
}

function recordUnlock(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code || SENTINEL);
  } catch {}
}

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

function readLockout(): LockoutState {
  try {
    const raw = sessionStorage.getItem('qurabia.gateLock');
    if (raw) return JSON.parse(raw) as LockoutState;
  } catch {}
  return { attempts: 0, lockedUntil: null };
}

function writeLockout(state: LockoutState): void {
  try {
    sessionStorage.setItem('qurabia.gateLock', JSON.stringify(state));
  } catch {}
}

interface SiteAccessGateProps {
  children: React.ReactNode;
}

export default function SiteAccessGate({ children }: SiteAccessGateProps) {
  const code = ACCESS_CODE || '';

  // إذا لم يكن هناك رمز وصول مضبوط، سجّل SENTINEL في localStorage ليمر landing.html
  const [unlocked, setUnlocked] = useState(() => {
    if (!code) {
      recordUnlock(''); // يضع SENTINEL في localStorage
      return true;
    }
    return isUnlocked(code);
  });

  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockout, setLockout] = useState<LockoutState>(() => readLockout());
  const [remaining, setRemaining] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockout.lockedUntil) return;
    const tick = () => {
      const diff = Math.max(0, (lockout.lockedUntil ?? 0) - Date.now());
      setRemaining(Math.ceil(diff / 1000));
      if (diff <= 0) {
        const next: LockoutState = { attempts: 0, lockedUntil: null };
        setLockout(next);
        writeLockout(next);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockout.lockedUntil]);

  useEffect(() => {
    if (!unlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [unlocked]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!code) return;

      // Check lockout
      if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
        setError(`محاولات كثيرة جداً. انتظر ${remaining} ثانية`);
        return;
      }

      if (input === code) {
        recordUnlock(code);
        const reset: LockoutState = { attempts: 0, lockedUntil: null };
        writeLockout(reset);

        // إعادة التوجيه إلى landing.html إذا جاء من هناك
        const params = new URLSearchParams(window.location.search);
        if (params.get('_from') === 'landing') {
          window.location.replace('/landing.html');
          return;
        }

        setUnlocked(true);
      } else {
        const newAttempts = lockout.attempts + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;
        const next: LockoutState = {
          attempts: shouldLock ? 0 : newAttempts,
          lockedUntil: shouldLock ? Date.now() + LOCKOUT_MS : null,
        };
        setLockout(next);
        writeLockout(next);
        setInput('');
        if (shouldLock) {
          setError(`تم تجاوز عدد المحاولات المسموح. انتظر ${LOCKOUT_MS / 60000} دقائق`);
        } else {
          setError(`رمز الوصول غير صحيح. المحاولة ${newAttempts}/${MAX_ATTEMPTS}`);
        }
      }
    },
    [code, input, lockout, remaining],
  );

  if (unlocked) return <>{children}</>;

  const isLockedOut = !!(lockout.lockedUntil && Date.now() < lockout.lockedUntil);

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background:
          'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(139, 92, 246, 0.15), transparent 70%), var(--bg, #0A0E1A)',
        fontFamily: 'var(--font-ar, system-ui)',
      }}
    >
      <div
        className="ui-card"
        style={{
          width: 'min(420px, 100%)',
          padding: '40px 32px',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          animation: 'uiPopIn var(--dur-3, 0.4s) var(--ease-emphasized, ease) both',
        }}
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.15))',
            border: '1.5px solid rgba(139,92,246,0.35)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 28,
          }}
        >
          🔒
        </div>

        {/* Brand + Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontFamily: 'var(--font-ui, var(--font-ar))',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 2,
              color: 'var(--fg, #fff)',
            }}
          >
            عرب qu
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-2, rgba(255,255,255,0.8))' }}>الوصول محظور</div>
          <div style={{ fontSize: 13, color: 'var(--fg-3, rgba(255,255,255,0.5))', lineHeight: 1.6 }}>
            هذه المنصة في وضع الوصول المقيّد.
            <br />
            أدخل رمز الوصول للمتابعة.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2, rgba(255,255,255,0.7))' }}>
              رمز الوصول
            </span>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder="أدخل رمز الوصول"
                dir="ltr"
                disabled={isLockedOut}
                autoComplete="off"
                className="ui-input"
                style={{
                  width: '100%',
                  paddingLeft: 40,
                  boxSizing: 'border-box',
                  letterSpacing: showPassword ? 'normal' : 4,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-3, rgba(255,255,255,0.4))',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 14,
                }}
                aria-label={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: '#ef4444',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {isLockedOut && (
            <output
              style={{
                fontSize: 13,
                color: '#f59e0b',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                textAlign: 'center',
                display: 'block',
              }}
            >
              مقفل مؤقتاً — المتبقي: {remaining} ثانية
            </output>
          )}

          <button
            type="submit"
            className="ui-btn ui-btn-filled"
            disabled={isLockedOut || !input.trim()}
            style={{
              width: '100%',
              padding: '13px 24px',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {isLockedOut ? `انتظر ${remaining}ث` : 'دخول'}
          </button>
        </form>

        <div style={{ fontSize: 12, color: 'var(--fg-3, rgba(255,255,255,0.3))', textAlign: 'center' }}>
          QURABIA — نظام الوصول المقيّد v1.0
        </div>
      </div>
    </div>
  );
}
