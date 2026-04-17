/**
 * QURABIA v4.7 — Claude-Inspired Home Page
 * صفحة رئيسية متقدمة بألوان Claude الدافئة مع تقنيات حديثة
 */

import React, { useEffect, useState } from 'react';
import '../styles/ClaudeDesignSystem.css';

interface Feature {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
}

interface Stat {
  value: string;
  labelAr: string;
  labelEn: string;
}

const ClaudeHomePage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isRTL, setIsRTL] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features: Feature[] = [
    {
      id: 'genesis',
      titleAr: 'نظام GENESIS v4.7',
      titleEn: 'GENESIS System v4.7',
      descriptionAr: 'محرك ذكاء اصطناعي متطور مع تحسين كمي وتعلم فيدرالي',
      descriptionEn: 'Advanced AI engine with quantum optimization and federated learning',
      icon: '🧬'
    },
    {
      id: 'quantum',
      titleAr: 'الحوسبة الكمومية',
      titleEn: 'Quantum Computing',
      descriptionAr: 'محاكاة دوائر كمية متقدمة بدعم يصل إلى 16 كيوبت',
      descriptionEn: 'Advanced quantum circuit simulation supporting up to 16 qubits',
      icon: '⚛️'
    },
    {
      id: 'security',
      titleAr: 'الأمان الكمومي',
      titleEn: 'Quantum Security',
      descriptionAr: 'تشفير مقاوم للحواسيب الكمية مع توقيع رقمي متقدم',
      descriptionEn: 'Post-quantum cryptography with advanced digital signatures',
      icon: '🔐'
    },
    {
      id: 'xai',
      titleAr: 'ذكاء اصطناعي قابل للتفسير',
      titleEn: 'Explainable AI',
      descriptionAr: 'لوحة تحكم متقدمة لفهم قرارات النماذج بشفافية كاملة',
      descriptionEn: 'Advanced dashboard for understanding model decisions with full transparency',
      icon: '🔍'
    },
    {
      id: 'realtime',
      titleAr: 'التعاون الفوري',
      titleEn: 'Real-time Collaboration',
      descriptionAr: 'منصة تعاونية متقدمة للعمل المشترك على التجارب',
      descriptionEn: 'Advanced collaborative platform for shared experimentation',
      icon: '🤝'
    },
    {
      id: 'performance',
      titleAr: 'أداء استثنائي',
      titleEn: 'Exceptional Performance',
      descriptionAr: 'تحسينات متقدمة مع WebAssembly وWebGPU للأداء الفائق',
      descriptionEn: 'Advanced optimizations with WebAssembly and WebGPU for superior performance',
      icon: '⚡'
    }
  ];

  const stats: Stat[] = [
    { value: '4.7', labelAr: 'الإصدار', labelEn: 'Version' },
    { value: '17+', labelAr: 'محرك استراتيجي', labelEn: 'Strategic Engines' },
    { value: '16', labelAr: 'كيوبت', labelEn: 'Qubits' },
    { value: '95+', labelAr: 'نقاط Lighthouse', labelEn: 'Lighthouse Score' }
  ];

  return (
    <div className="claude-home" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        {isRTL ? 'انتقل إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      {/* Header */}
      <header className="home-header" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        <nav className="container">
          <div className="nav-wrapper">
            <div className="logo">
              <span className="logo-icon">🌌</span>
              <span className="logo-text">QURABIA</span>
              <span className="version-badge badge">v4.7</span>
            </div>

            <div className="nav-links">
              <a href="#features" className="nav-link">{isRTL ? 'المميزات' : 'Features'}</a>
              <a href="#about" className="nav-link">{isRTL ? 'عن المنصة' : 'About'}</a>
              <a href="#contact" className="nav-link">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
              <button
                className="btn-ghost"
                onClick={() => setIsRTL(!isRTL)}
                aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                {isRTL ? 'EN' : 'ع'}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content animate-slide-up">
              <h1 className="hero-title font-display">
                {isRTL ? 'القوة الكمية العربية' : 'The Arab Quantum Power'}
              </h1>
              <p className="hero-subtitle">
                {isRTL
                  ? 'منصة عربية مبتكرة تجمع الذكاء الاصطناعي والحوسبة الكمية مع تصميم مستوحى من Claude'
                  : 'An innovative Arab platform combining AI and quantum computing with Claude-inspired design'
                }
              </p>

              <div className="hero-actions">
                <a href="/dashboard" className="btn">
                  {isRTL ? 'ابدأ الآن' : 'Get Started'}
                </a>
                <a href="#features" className="btn-secondary">
                  {isRTL ? 'اكتشف المزيد' : 'Discover More'}
                </a>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                {stats.map((stat) => (
                  <div key={stat.value} className="stat-item">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{isRTL ? stat.labelAr : stat.labelEn}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animated Background */}
            <div className="hero-bg" aria-hidden="true">
              <div className="particle particle-1" />
              <div className="particle particle-2" />
              <div className="particle particle-3" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="container">
            <h2 className="section-title font-display text-center">
              {isRTL ? 'المميزات المتقدمة' : 'Advanced Features'}
            </h2>
            <p className="section-subtitle text-center">
              {isRTL
                ? 'تقنيات حديثة مع تصميم دافئ مستوحى من ألوان Claude'
                : 'Modern technologies with warm design inspired by Claude colors'
              }
            </p>

            <div className="features-grid">
              {features.map((feature, index) => (
                <article
                  key={feature.id}
                  className="feature-card card-glass animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="feature-description">
                    {isRTL ? feature.descriptionAr : feature.descriptionEn}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section">
          <div className="container">
            <div className="about-content">
              <div className="about-text">
                <h2 className="section-title font-display">
                  {isRTL ? 'عن منصة QURABIA' : 'About QURABIA Platform'}
                </h2>
                <p>
                  {isRTL
                    ? 'QURABIA هي منصة عربية رائدة تجمع بين قوة الذكاء الاصطناعي والحوسبة الكمية. مع الإصدار 4.7، نقدم تجربة متطورة مع تصميم دافئ مستوحى من ألوان Claude الجذابة.'
                    : 'QURABIA is a leading Arab platform that combines the power of artificial intelligence and quantum computing. With version 4.7, we offer an advanced experience with warm design inspired by Claude\'s attractive colors.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'نستخدم أحدث التقنيات مثل WebAssembly وWebGPU وReact 18 لتقديم أداء استثنائي مع الحفاظ على إمكانية الوصول والأمان.'
                    : 'We use the latest technologies such as WebAssembly, WebGPU, and React 18 to deliver exceptional performance while maintaining accessibility and security.'
                  }
                </p>
                <a href="/platform" className="btn">
                  {isRTL ? 'استكشف المنصة' : 'Explore Platform'}
                </a>
              </div>

              <div className="about-visual card-glass">
                <div className="visual-content">
                  <div className="visual-icon">🚀</div>
                  <div className="visual-title">GENESIS v4.7</div>
                  <div className="visual-subtitle">
                    {isRTL ? 'محرك متقدم للذكاء الاصطناعي' : 'Advanced AI Engine'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content card-glass">
              <h2 className="cta-title font-display">
                {isRTL ? 'هل أنت مستعد للبدء؟' : 'Ready to Get Started?'}
              </h2>
              <p className="cta-description">
                {isRTL
                  ? 'انضم إلى منصة QURABIA اليوم واستكشف قوة الذكاء الاصطناعي والحوسبة الكمية'
                  : 'Join QURABIA platform today and explore the power of AI and quantum computing'
                }
              </p>
              <div className="cta-actions">
                <a href="/register" className="btn">
                  {isRTL ? 'إنشاء حساب' : 'Create Account'}
                </a>
                <a href="/demo" className="btn-secondary">
                  {isRTL ? 'تجربة مجانية' : 'Free Trial'}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🌌</span>
                <span className="logo-text">QURABIA</span>
              </div>
              <p className="footer-tagline">
                {isRTL ? 'نبني جسراً بين الحضارة العربية وتقنيات الغد' : 'Building a bridge between Arab civilization and tomorrow\'s technologies'}
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h3>{isRTL ? 'المنصة' : 'Platform'}</h3>
                <a href="/features">{isRTL ? 'المميزات' : 'Features'}</a>
                <a href="/pricing">{isRTL ? 'الأسعار' : 'Pricing'}</a>
                <a href="/docs">{isRTL ? 'التوثيق' : 'Documentation'}</a>
              </div>

              <div className="footer-column">
                <h3>{isRTL ? 'الشركة' : 'Company'}</h3>
                <a href="/about">{isRTL ? 'عن QURABIA' : 'About'}</a>
                <a href="/contact">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
                <a href="/careers">{isRTL ? 'الوظائف' : 'Careers'}</a>
              </div>

              <div className="footer-column">
                <h3>{isRTL ? 'الدعم' : 'Support'}</h3>
                <a href="/help">{isRTL ? 'مركز المساعدة' : 'Help Center'}</a>
                <a href="/community">{isRTL ? 'المجتمع' : 'Community'}</a>
                <a href="/status">{isRTL ? 'حالة النظام' : 'System Status'}</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 QURABIA — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
            <div className="footer-legal">
              <a href="/privacy">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
              <a href="/terms">{isRTL ? 'شروط الاستخدام' : 'Terms of Service'}</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .claude-home {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* Header Styles */
        .home-header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--border-default);
          padding: var(--sp-4) 0;
        }

        .nav-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .logo-icon {
          font-size: var(--text-2xl);
        }

        .version-badge {
          font-size: var(--text-xs);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--sp-5);
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--dur-2) var(--ease-standard);
        }

        .nav-link:hover {
          color: var(--accent-primary);
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: var(--sp-10) 0;
        }

        .hero-title {
          font-size: var(--text-5xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--sp-4);
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          max-width: 800px;
          margin: 0 auto var(--sp-6);
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: var(--sp-4);
          justify-content: center;
          margin-bottom: var(--sp-8);
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--sp-6);
          max-width: 800px;
          margin: 0 auto;
          padding-top: var(--sp-6);
          border-top: 1px solid var(--border-default);
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--accent-primary);
          margin-bottom: var(--sp-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        /* Animated Background */
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.4;
          animation: float 20s infinite ease-in-out;
        }

        .particle-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, var(--cl-orange), transparent);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle-2 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--cl-brown), transparent);
          bottom: 20%;
          right: 15%;
          animation-delay: 5s;
        }

        .particle-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, var(--cl-orange-light), transparent);
          top: 50%;
          left: 50%;
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Features Section */
        .features-section {
          padding: var(--sp-10) 0;
          background: var(--bg-secondary);
        }

        .section-title {
          font-size: var(--text-4xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--sp-3);
        }

        .section-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          margin-bottom: var(--sp-8);
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--sp-6);
          margin-top: var(--sp-8);
        }

        .feature-card {
          text-align: center;
          padding: var(--sp-6);
          transition: all var(--dur-3) var(--ease-standard);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--sh-medium);
        }

        .feature-icon {
          font-size: 4rem;
          margin-bottom: var(--sp-4);
        }

        .feature-title {
          font-size: var(--text-xl);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--sp-3);
        }

        .feature-description {
          font-size: var(--text-base);
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* About Section */
        .about-section {
          padding: var(--sp-10) 0;
        }

        .about-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-8);
          align-items: center;
        }

        .about-text p {
          font-size: var(--text-base);
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: var(--sp-4);
        }

        .about-visual {
          padding: var(--sp-8);
          text-align: center;
        }

        .visual-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sp-4);
        }

        .visual-icon {
          font-size: 6rem;
        }

        .visual-title {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--accent-primary);
        }

        .visual-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
        }

        /* CTA Section */
        .cta-section {
          padding: var(--sp-10) 0;
          background: var(--bg-secondary);
        }

        .cta-content {
          padding: var(--sp-8);
          text-align: center;
        }

        .cta-title {
          font-size: var(--text-4xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--sp-4);
        }

        .cta-description {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          max-width: 700px;
          margin: 0 auto var(--sp-6);
        }

        .cta-actions {
          display: flex;
          gap: var(--sp-4);
          justify-content: center;
        }

        /* Footer */
        .home-footer {
          background: var(--bg-tertiary);
          padding: var(--sp-10) 0 var(--sp-6);
          border-top: 1px solid var(--border-default);
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: var(--sp-8);
          margin-bottom: var(--sp-8);
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--sp-3);
        }

        .footer-tagline {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-6);
        }

        .footer-column h3 {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--sp-3);
        }

        .footer-column a {
          display: block;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: var(--sp-2);
          transition: color var(--dur-2) var(--ease-standard);
        }

        .footer-column a:hover {
          color: var(--accent-primary);
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--sp-6);
          border-top: 1px solid var(--border-default);
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }

        .footer-legal {
          display: flex;
          gap: var(--sp-4);
        }

        .footer-legal a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color var(--dur-2) var(--ease-standard);
        }

        .footer-legal a:hover {
          color: var(--accent-primary);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav-links {
            gap: var(--sp-3);
          }

          .hero-title {
            font-size: var(--text-3xl);
          }

          .hero-actions {
            flex-direction: column;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .about-content {
            grid-template-columns: 1fr;
          }

          .footer-content {
            grid-template-columns: 1fr;
          }

          .footer-links {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            gap: var(--sp-3);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ClaudeHomePage;
