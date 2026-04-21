import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      if (isRegister) {
        if (!name.trim()) { setLocalError('الاسم مطلوب'); return; }
        if (password.length < 8) { setLocalError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
        await register(name, email, password);
        toast.success('تم إنشاء الحساب بنجاح!');
      } else {
        await login(email, password);
        toast.success('تم تسجيل الدخول بنجاح!');
      }
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('تم تسجيل الدخول عبر Google بنجاح!');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر Google';
      setLocalError(msg);
      toast.error(msg);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(600px 400px at 50% 40%, rgba(139, 92, 246, 0.12), transparent 70%), var(--bg)',
        fontFamily: 'var(--font-ar, system-ui)',
      }}
    >
      <div
        className="ui-card"
        style={{
          width: 'min(440px, 100%)',
          padding: 32,
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/"
            style={{ color: 'var(--fg-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>
              عرب qu
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
              {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>الاسم</span>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="عبدالله"
                  required
                  className="ui-input"
                  style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box' }}
                />
              </div>
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>البريد الإلكتروني</span>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }}
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                dir="ltr"
                className="ui-input"
                style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box' }}
              />
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>كلمة المرور</span>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                className="ui-input"
                style={{ width: '100%', paddingRight: 36, paddingLeft: 36, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-3)',
                  cursor: 'pointer',
                  padding: 4,
                }}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {localError && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: '#ef4444',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {localError}
            </div>
          )}

          <button
            type="submit"
            className="ui-btn ui-btn-filled"
            disabled={isLoading}
            style={{ width: '100%', padding: '12px 24px', borderRadius: 14, fontSize: 15, fontWeight: 700 }}
          >
            {isLoading ? 'جاري المعالجة...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--fg-3)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--outline)' }} />
          أو
          <div style={{ flex: 1, height: 1, background: 'var(--outline)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { setLocalError('فشل تسجيل الدخول عبر Google'); }}
            text="continue_with"
            shape="pill"
            theme="filled_black"
            width={340}
          />
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-3)' }}>
          {isRegister ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
          <button
            type="button"
            onClick={() => { setIsRegister(r => !r); setLocalError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--p-primary)', cursor: 'pointer', fontWeight: 700, padding: 0 }}
          >
            {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </div>
      </div>
    </div>
  );
}
