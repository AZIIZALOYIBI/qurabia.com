import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  freezeOnceVisible?: boolean;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefCallback<Element>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  wasEverVisible: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn => {
  const { threshold = 0, rootMargin = '0px', root = null, freezeOnceVisible = false, triggerOnce = false } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [wasEverVisible, setWasEverVisible] = useState(false);

  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const frozenRef = useRef(false);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const ref = useCallback(
    (node: Element | null) => {
      cleanup();
      elementRef.current = node;

      if (!node || frozenRef.current) return;
      if (typeof IntersectionObserver === 'undefined') {
        setIsIntersecting(true);
        setWasEverVisible(true);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([observerEntry]) => {
          const isVisible = observerEntry.isIntersecting;
          setIsIntersecting(isVisible);

          if (isVisible) {
            setWasEverVisible(true);
          }

          setEntry(observerEntry);

          if (isVisible && (freezeOnceVisible || triggerOnce)) {
            frozenRef.current = true;
            cleanup();
          }
        },
        { threshold, rootMargin, root },
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, root, freezeOnceVisible, triggerOnce, cleanup],
  );

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { ref, isIntersecting, entry, wasEverVisible };
};

export type { UseIntersectionObserverOptions, UseIntersectionObserverReturn };
