import React, { Suspense, useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string;
  className?: string;
}

const DefaultSkeleton: React.FC = () => (
  <div className="lazy-skeleton" role="status" aria-label="جارٍ التحميل">
    <div className="lazy-skeleton__spinner" />
  </div>
);

const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  height,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: observerRef, wasEverVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
    triggerOnce: true,
  });

  const setRefs = (node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    observerRef(node);
  };

  return (
    <div
      ref={setRefs}
      className={className}
      style={height ? { minHeight: height } : undefined}
    >
      {wasEverVisible ? (
        <Suspense fallback={fallback ?? <DefaultSkeleton />}>
          {children}
        </Suspense>
      ) : (
        fallback ?? <DefaultSkeleton />
      )}
    </div>
  );
};

export default LazySection;
