import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Send, Mail, User, MessageSquare, ArrowLeft, Github, Twitter } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  const API_BASE = (() => {
    try {
      const override = localStorage.getItem('qurabia.apiBase') || '';
      if (override) return override.trim().replace(/\/+$/, '');
    } catch {}
    const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
    if (fromEnv) return fromEnv;
    if (import.meta.env.DEV) return '';
    return 'https://api.qurabia.com';
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsSending(true);
    try {
      const resp = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!resp.ok) throw new Error('فشل إرسال الرسالة');
      toast.success('تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      toast.error('فشل إرسال الرسالة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        fontFamily: 'var(--font-ar, system-ui)',
        background: 'radial-gradient(600px 400px at 50% 40%, rgba(139, 92, 246, 0.08), transparent 70%), var(--bg)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--fg-3)',
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            <ArrowLeft size={14} />
            العودة للرئيسية
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: 'var(--fg)' }}>تواصل معنا</h1>
            <p style={{ fontSize: 15, color: 'var(--fg-3)', lineHeight: 1.8, margin: 0 }}>
              نسعد بتواصلك معنا. سواء كان لديك سؤال، اقتراح، أو تريد التعاون معنا — فريق عرب qu مستعد للمساعدة.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
              <div className="ui-card" style={{ padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <Mail size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>البريد الإلكتروني</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>contact@qurabia.com</div>
                </div>
              </div>

              <div className="ui-card" style={{ padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <Github size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>GitHub</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>github.com/AZIIZALOYIBI/qurabia.com</div>
                </div>
              </div>

              <div className="ui-card" style={{ padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <Twitter size={18} style={{ color: '#06b6d4' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>تويتر</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>@qurabia</div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="ui-card"
            style={{
              padding: 28,
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignSelf: 'start',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>الاسم *</span>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="ui-input"
                  style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box' }}
                  placeholder="اسمك الكريم"
                />
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>البريد الإلكتروني *</span>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="ui-input"
                  style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box' }}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>الموضوع</span>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="ui-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="موضوع الرسالة"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>الرسالة *</span>
              <div style={{ position: 'relative' }}>
                <MessageSquare size={16} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--fg-3)' }} />
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="ui-input"
                  style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box', resize: 'vertical', minHeight: 120 }}
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>
            </label>

            <button
              type="submit"
              className="ui-btn ui-btn-filled"
              disabled={isSending}
              style={{ padding: '12px 24px', borderRadius: 14, fontSize: 15, fontWeight: 700 }}
            >
              <Send size={16} />
              {isSending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
