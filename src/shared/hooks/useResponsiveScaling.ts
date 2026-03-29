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
const SCALE_BUFFER = 0.98;
const OVERFLOW_TOLERANCE = 1.001;

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
  const pendingResetRef = useRef(false);

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
    pendingResetRef.current = true;
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
    if (pendingResetRef.current) {
      pendingResetRef.current = false;

      if (contentScale !== DEFAULT_SCALE) {
        setContentScale(DEFAULT_SCALE);
        return;
      }
    }

    if (!containerRef.current || containerWidth === 0 || containerHeight === 0) {
      return;
    }

    const overflowSources: number[] = [];

    const eventLists = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-board-column-events]')
    );
    eventLists.forEach((element) => {
      overflowSources.push(getOverflowRatio(element, 'vertical'));
      overflowSources.push(getOverflowRatio(element, 'horizontal'));
    });

    const footerItems = containerRef.current.querySelector<HTMLElement>('[data-board-footer-items]');
    if (footerItems) {
      overflowSources.push(getOverflowRatio(footerItems, 'horizontal'));
      overflowSources.push(getOverflowRatio(footerItems, 'vertical'));
    }

    const overflowRatio = Math.max(1, ...overflowSources);

    if (overflowRatio <= OVERFLOW_TOLERANCE) {
      return;
    }

    const nextScale = Math.max(
      MIN_SCALE,
      Math.min(DEFAULT_SCALE, contentScale / overflowRatio * SCALE_BUFFER)
    );

    if (Math.abs(nextScale - contentScale) < 0.002) {
      return;
    }

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
    contentScale,
    fontEpoch,
  ]);

  return { contentScale };
};
