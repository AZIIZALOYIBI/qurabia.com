import { useCallback, useMemo, useRef, useState } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface UseVirtualScrollReturn {
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  innerProps: {
    style: React.CSSProperties;
  };
  visibleItems: {
    index: number;
    offsetTop: number;
  }[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollTop: number;
}

export const useVirtualScroll = ({
  itemCount,
  itemHeight,
  overscan = 3,
  containerHeight,
}: UseVirtualScrollOptions): UseVirtualScrollReturn => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalHeight = useMemo(() => itemCount * itemHeight, [itemCount, itemHeight]);

  const startIndex = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight) - overscan;
    return Math.max(0, start);
  }, [scrollTop, itemHeight, overscan]);

  const endIndex = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = startIndex + visibleCount + overscan * 2;
    return Math.min(itemCount - 1, end);
  }, [scrollTop, itemHeight, overscan, containerHeight, startIndex, itemCount]);

  const visibleItems = useMemo(() => {
    const items: { index: number; offsetTop: number }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({ index: i, offsetTop: i * itemHeight });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight],
  );

  const containerProps = useMemo(
    () => ({
      style: {
        overflow: 'auto' as const,
        height: containerHeight,
        contain: 'strict' as const,
      },
      onScroll,
      ref: containerRef,
    }),
    [containerHeight, onScroll],
  );

  const innerProps = useMemo(
    () => ({
      style: {
        position: 'relative' as const,
        height: totalHeight,
      },
    }),
    [totalHeight],
  );

  return { containerProps, innerProps, visibleItems, totalHeight, scrollToIndex, scrollTop };
};

export type { UseVirtualScrollOptions, UseVirtualScrollReturn };
