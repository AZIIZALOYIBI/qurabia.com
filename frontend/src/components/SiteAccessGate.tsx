import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// الرمز الافتراضي — غيّره هنا أو اضبط VITE_SITE_ACCESS_CODE في متغيرات البيئة
const DEFAULT_PIN = '2025';

const ACCESS_CODE = (import.meta.env.VITE_SITE_ACCESS_CODE as string | undefined)?.trim() || DEFAULT_PIN;
const PIN_LENGTH = ACCESS_CODE.length;
// مفاتيح ثابتة لحقول PIN — لا تتغير أبدًا (تدعم حتى 10 خانات)
const PIN_SLOT_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'] as const;
const STORAGE_KEY = 'qurabia.siteAccess';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 دقائق

/** عدد الجسيمات الكمية العائمة في الخلفية */
const PARTICLE_COUNT = 18;

function isUnlocked(): boolean {
  try {
    // Check URL parameter for CI/testing bypass
    const urlParams = new URLSearchParams(window.location.search);
    const urlUnlock = urlParams.get('unlock');
    if (urlUnlock === ACCESS_CODE) {
      recordUnlock();
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) === ACCESS_CODE;
  } catch {
    return false;
  }
}

function recordUnlock(): void {
  try {
    localStorage.setItem(STORAGE_KEY, ACCESS_CODE);
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

/** توليد بيانات جسيمات ثابتة (لا تتغير بين renders) */
function generateParticles(count: number) {
  const particles: Array<{
    left: string;
    top: string;
    size: number;
    duration: string;
    delay: string;
    opacity: number;
  }> = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 7 + 13) % 100;
    particles.push({
      left: `${(seed * 3.7) % 100}%`,
      top: `${(seed * 5.3 + 20) % 100}%`,
      size: 2 + (seed % 4),
      duration: `${6 + (seed % 8)}s`,
      delay: `${(seed % 5) * -1}s`,
      opacity: 0.15 + (seed % 30) / 100,
    });
  }
  return particles;
}

const PARTICLES = generateParticles(PARTICLE_COUNT);

/** CSS keyframes المشتركة لكل الحركات */
const GATE_KEYFRAMES = `
  @keyframes pinShake {
    0%,100% { transform: translateX(0) }
    15%     { transform: translateX(-8px) }
    30%     { transform: translateX(8px) }
    45%     { transform: translateX(-6px) }
    60%     { transform: translateX(6px) }
    75%     { transform: translateX(-3px) }
    90%     { transform: translateX(3px) }
  }
  @keyframes particleFloat {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: var(--p-opacity) }
    25%  { transform: translateY(-18px) translateX(8px) scale(1.2) }
    50%  { transform: translateY(-6px) translateX(-6px) scale(0.9); opacity: calc(var(--p-opacity) * 0.5) }
    75%  { transform: translateY(-22px) translateX(4px) scale(1.1) }
    100% { transform: translateY(0) translateX(0) scale(1); opacity: var(--p-opacity) }
  }
  @keyframes orbitSpin {
    from { transform: rotate(0deg) }
    to   { transform: rotate(360deg) }
  }
  @keyframes orbitSpinReverse {
    from { transform: rotate(360deg) }
    to   { transform: rotate(0deg) }
  }
  @keyframes lockPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3) }
    50%     { box-shadow: 0 0 20px 4px rgba(139,92,246,0.15) }
  }
  @keyframes digitGlow {
    0%   { box-shadow: 0 0 0 0 rgba(139,92,246,0) }
    50%  { box-shadow: 0 0 12px 2px rgba(139,92,246,0.35) }
    100% { box-shadow: 0 0 0 0 rgba(139,92,246,0) }
  }
  @keyframes unlockBurst {
    0%   { transform: scale(1); opacity: 1; filter: blur(0) }
    40%  { transform: scale(1.05); opacity: 1; filter: blur(0) }
    100% { transform: scale(1.3); opacity: 0; filter: blur(8px) }
  }
  @keyframes progressGlow {
    0%,100% { filter: brightness(1) }
    50%     { filter: brightness(1.4) }
  }
`;

interface SiteAccessGateProps {
  children: React.ReactNode;
}

export default function SiteAccessGate({ children }: SiteAccessGateProps) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [lockout, setLockout] = useState<LockoutState>(() => readLockout());
  const [remaining, setRemaining] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [lastFilledIndex, setLastFilledIndex] = useState(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // عداد تنازلي للقفل
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

  // Focus أول خانة عند العرض
  useEffect(() => {
    if (!unlocked) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [unlocked]);

  // إزالة توهج الحقل بعد فترة قصيرة
  useEffect(() => {
    if (lastFilledIndex < 0) return;
    const t = setTimeout(() => setLastFilledIndex(-1), 500);
    return () => clearTimeout(t);
  }, [lastFilledIndex]);

  const triggerError = useCallback((msg: string) => {
    setError(msg);
    setShake(true);
    setDigits(Array(PIN_LENGTH).fill(''));
    setLastFilledIndex(-1);
    setTimeout(() => {
      setShake(false);
      inputRefs.current[0]?.focus();
    }, 600);
  }, []);

  const checkPin = useCallback(
    (pin: string) => {
      if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) return;

      if (pin === ACCESS_CODE) {
        recordUnlock();
        writeLockout({ attempts: 0, lockedUntil: null });

        // العودة لـ landing.html إذا جاء منها
        const params = new URLSearchParams(window.location.search);
        if (params.get('_from') === 'landing') {
          window.location.replace('/landing.html');
          return;
        }
        // تأثير الفتح قبل الانتقال
        setUnlocking(true);
        setTimeout(() => setUnlocked(true), 700);
      } else {
        const newAttempts = lockout.attempts + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;
        const next: LockoutState = {
          attempts: shouldLock ? 0 : newAttempts,
          lockedUntil: shouldLock ? Date.now() + LOCKOUT_MS : null,
        };
        setLockout(next);
        writeLockout(next);

        if (shouldLock) {
          triggerError(`محاولات كثيرة. مقفل لـ ${LOCKOUT_MS / 60000} دقائق`);
        } else {
          triggerError(`الرقم غير صحيح — المحاولة ${newAttempts}/${MAX_ATTEMPTS}`);
        }
      }
    },
    [lockout, triggerError],
  );

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1);
      if (!digit) return;

      const next = [...digits];
      next[index] = digit;
      setDigits(next);
      setError('');
      setLastFilledIndex(index);

      if (index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // آخر رقم — تحقق فوراً
        const pin = next.join('');
        if (pin.length === PIN_LENGTH) {
          setTimeout(() => checkPin(pin), 80);
        }
      }
    },
    [digits, checkPin],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const next = [...digits];
        if (next[index]) {
          next[index] = '';
          setDigits(next);
        } else if (index > 0) {
          next[index - 1] = '';
          setDigits(next);
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  // دعم اللصق
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
      if (!pasted) return;
      const next = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setDigits(next);
      setError('');
      const lastFilled = Math.min(pasted.length, PIN_LENGTH - 1);
      setLastFilledIndex(lastFilled);
      inputRefs.current[lastFilled]?.focus();
      if (pasted.length === PIN_LENGTH) {
        setTimeout(() => checkPin(pasted), 80);
      }
    },
    [checkPin],
  );

  if (unlocked) return <>{children}</>;

  const isLockedOut = !!(lockout.lockedUntil && Date.now() < lockout.lockedUntil);
  const filled = digits.filter(Boolean).length;
  const progressPct = (filled / PIN_LENGTH) * 100;

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
        overflow: 'hidden',
      }}
    >
      <style>{GATE_KEYFRAMES}</style>

      {/* ═══ جسيمات كمية عائمة ═══ */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {PARTICLES.map((p, i) => (
          <div
            key={`qp-${i}`}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background:
                i % 3 === 0 ? 'rgba(139,92,246,0.8)' : i % 3 === 1 ? 'rgba(59,130,246,0.7)' : 'rgba(236,72,153,0.6)',
              ['--p-opacity' as string]: p.opacity,
              opacity: p.opacity,
              animation: `particleFloat ${p.duration} ease-in-out ${p.delay} infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      <div
        className="ui-card"
        style={{
          position: 'relative',
          width: 'min(380px, 100%)',
          padding: '40px 28px',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          animation: unlocking
            ? 'unlockBurst 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'uiPopIn var(--dur-3, 0.4s) var(--ease-emphasized, ease) both',
        }}
      >
        {/* ═══ أيقونة القفل مع حلقات مدارية ═══ */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            width: 90,
            height: 90,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {/* حلقة مدارية 1 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px solid rgba(139,92,246,0.2)',
              borderTopColor: 'rgba(139,92,246,0.6)',
              animation: 'orbitSpin 4s linear infinite',
            }}
          />
          {/* حلقة مدارية 2 */}
          <div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: '1px solid rgba(59,130,246,0.15)',
              borderBottomColor: 'rgba(59,130,246,0.5)',
              animation: 'orbitSpinReverse 6s linear infinite',
            }}
          />
          {/* نواة القفل */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.15))',
              border: '1.5px solid rgba(139,92,246,0.35)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              animation: 'lockPulse 3s ease-in-out infinite',
              zIndex: 1,
            }}
          >
            {unlocking ? '🔓' : '🔒'}
          </div>
        </div>

        {/* ═══ العنوان ═══ */}
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
            QURABIA
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-2, rgba(255,255,255,0.8))' }}>
            أدخل رمز الدخول
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-3, rgba(255,255,255,0.45))', lineHeight: 1.6 }}>
            {PIN_LENGTH} أرقام للدخول إلى المنصة
          </div>
        </div>

        {/* ═══ شريط التقدم الكمي ═══ */}
        <div
          style={{
            width: '100%',
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 2,
              background: error
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(59,130,246,0.9))',
              transition: 'width 0.25s ease, background 0.3s ease',
              animation: filled > 0 && !error ? 'progressGlow 2s ease-in-out infinite' : 'none',
            }}
          />
        </div>

        {/* ═══ حقول PIN ═══ */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            animation: shake ? 'pinShake 0.55s cubic-bezier(.36,.07,.19,.97)' : 'none',
          }}
        >
          {digits.map((d, i) => (
            <input
              key={PIN_SLOT_KEYS[i]}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              disabled={isLockedOut || unlocking}
              autoComplete="off"
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onClick={() => inputRefs.current[i]?.select()}
              style={{
                width: 52,
                height: 60,
                borderRadius: 14,
                border: `2px solid ${
                  error ? 'rgba(239,68,68,0.6)' : d ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.12)'
                }`,
                background: d ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
                transition: 'border-color 0.18s, background 0.18s, box-shadow 0.3s',
                cursor: isLockedOut ? 'not-allowed' : 'text',
                caretColor: 'transparent',
                animation: lastFilledIndex === i ? 'digitGlow 0.5s ease-out' : 'none',
              }}
            />
          ))}
        </div>

        {/* ═══ رسالة الخطأ ═══ */}
        {error && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: '#ef4444',
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {error}
          </div>
        )}

        {/* ═══ عداد القفل ═══ */}
        {isLockedOut && (
          <output
            style={{
              fontSize: 13,
              color: '#f59e0b',
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box',
              display: 'block',
            }}
          >
            🔒 مقفل مؤقتاً — المتبقي: {remaining} ثانية
          </output>
        )}

        {/* ═══ زر الدخول ═══ */}
        <button
          type="button"
          className="ui-btn ui-btn-filled"
          disabled={isLockedOut || filled < PIN_LENGTH || unlocking}
          onClick={() => checkPin(digits.join(''))}
          style={{
            width: '100%',
            padding: '13px 24px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {unlocking ? '🔓 جارٍ الفتح…' : isLockedOut ? `انتظر ${remaining}ث` : 'دخول'}
        </button>

        <div style={{ fontSize: 11, color: 'var(--fg-3, rgba(255,255,255,0.25))', textAlign: 'center' }}>
          QURABIA — الوصول المقيّد
        </div>
      </div>
    </div>
  );
}
