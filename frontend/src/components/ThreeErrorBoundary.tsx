/**
 * ============================================================
 * ThreeErrorBoundary.tsx - حدود خطأ مخصصة لمكونات Three.js
 * QURABIA
 *
 * يلتقط أخطاء التصيير في مكونات WebGL/Three.js ويعرض واجهة
 * بديلة بدلاً من تعطل التطبيق بالكامل.
 * ============================================================
 */

import React from 'react';

interface ThreeErrorBoundaryProps {
  children: React.ReactNode;
  /** حجم المساحة البديلة (بالبكسل) */
  fallbackSize?: number;
}

interface ThreeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * حدود خطأ مخصصة لمكونات Three.js/WebGL.
 * عند فشل التصيير ثلاثي الأبعاد (مثلاً: عدم دعم WebGL)،
 * يعرض واجهة بديلة أنيقة بدلاً من تعطل التطبيق.
 */
class ThreeErrorBoundary extends React.Component<ThreeErrorBoundaryProps, ThreeErrorBoundaryState> {
  constructor(props: ThreeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ThreeErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const size = this.props.fallbackSize ?? 300;
      return (
        <div
          role="alert"
          aria-label="خطأ في التصيير ثلاثي الأبعاد"
          style={{
            width: size,
            height: size,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(0,255,255,0.1)',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                fontSize: 32,
                filter: 'grayscale(1)',
              }}
              aria-hidden="true"
            >
              🔮
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ar)',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--fg-2, #a1a1aa)',
              }}
            >
              تعذّر تحميل التصيير ثلاثي الأبعاد
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--fg-3, #71717a)',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message ?? 'WebGL غير متوفر'}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ThreeErrorBoundary;
