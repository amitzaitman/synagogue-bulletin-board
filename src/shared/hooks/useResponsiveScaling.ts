import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Column, EventItem, BoardSettings } from '../types/types';

interface UseResponsiveScalingProps {
  containerRef: RefObject<HTMLElement | null>;
  containerWidth: number;
  containerHeight: number;
  headerHeight: number;
  footerHeight: number;
  columns: Column[];
  events: EventItem[];
  settings: BoardSettings;
}

interface ScalingResult {
  contentScale: number;
}

const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.1;
const OVERFLOW_TOLERANCE = 1.001;
const SCALE_PRECISION = 0.01;
const MAX_SEARCH_ITERATIONS = 10;

interface SearchState {
  active: boolean;
  low: number;
  high: number;
  current: number;
  iterations: number;
}

const getOverflowRatio = (element: HTMLElement, axis: 'horizontal' | 'vertical'): number => {
  const visibleSize = axis === 'horizontal' ? element.clientWidth : element.clientHeight;
  const contentSize = axis === 'horizontal' ? element.scrollWidth : element.scrollHeight;

  if (visibleSize === 0) {
    return 1;
  }

  return contentSize / visibleSize;
};

export const useResponsiveScaling = ({
  containerRef,
  containerWidth,
  containerHeight,
  headerHeight,
  footerHeight,
  columns,
  events,
  settings,
}: UseResponsiveScalingProps): ScalingResult => {
  const [contentScale, setContentScale] = useState(DEFAULT_SCALE);
  const [fontEpoch, setFontEpoch] = useState(0);
  const searchRef = useRef<SearchState>({
    active: false,
    low: 0,
    high: DEFAULT_SCALE,
    current: DEFAULT_SCALE,
    iterations: 0,
  });

  useEffect(() => {
    const fontSet = document.fonts;

    if (!fontSet) {
      return;
    }

    let cancelled = false;

    fontSet.ready.then(() => {
      if (!cancelled) {
        setFontEpoch((value) => value + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    searchRef.current = {
      active: true,
      low: 0,
      high: DEFAULT_SCALE,
      current: DEFAULT_SCALE,
      iterations: 0,
    };

    if (contentScale !== DEFAULT_SCALE) {
      setContentScale(DEFAULT_SCALE);
    }
  }, [
    containerWidth,
    containerHeight,
    headerHeight,
    footerHeight,
    columns,
    events,
    settings.boardMessages,
    settings.boardMessageFontSize,
    settings.columnTitleSize,
    settings.eventPaddingX,
    settings.eventPaddingY,
    settings.eventTextScale,
    fontEpoch,
  ]);

  useLayoutEffect(() => {
    if (!containerRef.current || containerWidth === 0 || containerHeight === 0) {
      return;
    }

    const eventLists = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-board-column-events]')
    );
    const overflowRatio = Math.max(
      1,
      ...eventLists.map((element) => getOverflowRatio(element, 'vertical'))
    );
    const fits = overflowRatio <= OVERFLOW_TOLERANCE;
    const search = searchRef.current;

    if (!search.active) {
      return;
    }

    if (fits) {
      search.low = search.current;
    } else {
      search.high = search.current;
    }

    search.iterations += 1;

    const searchComplete =
      search.high - search.low <= SCALE_PRECISION ||
      search.iterations >= MAX_SEARCH_ITERATIONS ||
      (search.current <= MIN_SCALE + SCALE_PRECISION && !fits);

    if (searchComplete) {
      search.active = false;
      const finalScale = Math.max(MIN_SCALE, Math.min(DEFAULT_SCALE, search.low || MIN_SCALE));

      if (Math.abs(finalScale - contentScale) >= 0.002) {
        setContentScale(finalScale);
      }

      return;
    }

    let nextScale = (search.low + search.high) / 2;

    if (nextScale < MIN_SCALE) {
      nextScale = MIN_SCALE;
    }

    if (Math.abs(nextScale - search.current) < 0.002) {
      search.active = false;
      const finalScale = Math.max(MIN_SCALE, Math.min(DEFAULT_SCALE, search.low || MIN_SCALE));

      if (Math.abs(finalScale - contentScale) >= 0.002) {
        setContentScale(finalScale);
      }

      return;
    }

    search.current = nextScale;
    setContentScale(nextScale);
  }, [
    containerRef,
    containerWidth,
    containerHeight,
    headerHeight,
    footerHeight,
    columns,
    events,
    settings.boardMessages,
    settings.boardMessageFontSize,
    settings.columnTitleSize,
    settings.eventPaddingX,
    settings.eventPaddingY,
    settings.eventTextScale,
    fontEpoch,
    contentScale,
  ]);

  return { contentScale };
};
