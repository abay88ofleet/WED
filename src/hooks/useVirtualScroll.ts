import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface UseVirtualScrollReturn<T> {
  virtualItems: Array<{
    index: number;
    data: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): UseVirtualScrollReturn<T> {
  const { itemHeight, overscan = 3, containerHeight: fixedContainerHeight } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    fixedContainerHeight || 600
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fixedContainerHeight && containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [fixedContainerHeight]);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      data: items[i],
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: `${itemHeight}px`,
        transform: `translateY(${i * itemHeight}px)`,
      },
    });
  }

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const scrollPosition = index * itemHeight;
        containerRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}

export function useInfiniteScroll<T>(
  items: T[],
  loadMore: () => Promise<void>,
  hasMore: boolean
): {
  items: T[];
  isLoadingMore: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
} {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          try {
            await loadMore();
          } catch (error) {
            console.error('Error loading more items:', error);
          } finally {
            setIsLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    items,
    isLoadingMore,
    observerRef,
  };
}
