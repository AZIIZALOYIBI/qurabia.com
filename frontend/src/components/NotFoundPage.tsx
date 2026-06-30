
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      dir="rtl"
      role="main"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(600px 400px at 50% 40%, rgba(139, 92, 246, 0.08), transparent 70%), var(--bg)',
        fontFamily: 'var(--font-ar, system-ui)',
      }}
    >
      <div
        className="ui-card"
        style={{
          padding: 40,
          borderRadius: 24,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 480,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <AlertTriangle size={36} style={{ color: '#f59e0b' }} />
        </div>

        <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--fg)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--fg)' }}>
          الصفحة غير موجودة
        </h1>

        <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.7, margin: 0, maxWidth: 360 }}>
          يبدو أنك ضللت الطريق في الفضاء الكمي. الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <Link
          to="/"
          className="ui-btn ui-btn-filled"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            padding: '12px 28px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          <Home size={18} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
