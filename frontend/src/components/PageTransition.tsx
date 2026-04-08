/**
 * PageTransition — مؤشر انتقال كمومي بين الصفحات
 *
 * يعرض شريط ضوئي متحرك عند الانتقال بين الصفحات/الأقسام
 */
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface PageTransitionProps {
  /** يُعيَّن إلى true لتشغيل تحريك الانتقال */
  active: boolean;
  onComplete?: () => void;
}

const PAGE_TRANSITION_DURATION_MS = 600;

const PageTransition: React.FC<PageTransitionProps> = ({ active, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, PAGE_TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div className="q-page-transition" aria-hidden="true">
      <div className="q-page-transition-beam" />
    </div>
  );
};

/**
 * usePageTransition — hook لتشغيل الانتقال
 */
export const usePageTransition = () => {
  const [transitioning, setTransitioning] = useState(false);

  const trigger = useCallback(() => {
    setTransitioning(true);
  }, []);

  const onComplete = useCallback(() => {
    setTransitioning(false);
  }, []);

  return { transitioning, trigger, onComplete };
};

export default PageTransition;
