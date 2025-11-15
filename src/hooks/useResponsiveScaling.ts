import { useState, useEffect, useCallback, useRef } from 'react';
import { Column, EventItem } from '../types';

interface UseResponsiveScalingProps {
  containerWidth: number;
  containerHeight: number;
  headerHeight: number;
  columns: Column[];
  events: EventItem[];
  zoomLevel: number;
}

interface ScalingResult {
  headerScale: number;
  contentScale: number;
}

const DESIGN_WIDTH = 1920; // 16:9 reference width
const MIN_COLUMN_WIDTH = 400; // Minimum px width per column
const DEBOUNCE_MS = 150;

export const useResponsiveScaling = ({
  containerWidth,
  containerHeight,
  headerHeight,
  columns,
  events,
  zoomLevel,
}: UseResponsiveScalingProps): ScalingResult => {
  const [headerScale, setHeaderScale] = useState(1);
  const [contentScale, setContentScale] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateScales = useCallback(() => {
    if (containerWidth === 0 || containerHeight === 0) {
      return;
    }

    // 1. Header scales by width only
    const baseHeaderScale = containerWidth / DESIGN_WIDTH;
    const finalHeaderScale = baseHeaderScale * zoomLevel;

    // 2. Content scales by density with upper bound
    const availableHeight = containerHeight - headerHeight;
    const numColumns = columns.length || 1;

    // Calculate width scale based on number of columns
    const widthScale = containerWidth / (numColumns * MIN_COLUMN_WIDTH);

    // Find the tallest column (most events)
    const maxEventsInColumn = Math.max(
      ...columns.map(col =>
        events.filter(e => e.columnId === col.id).length
      ),
      1 // At least 1 to avoid division by zero
    );

    // Estimate row height based on typical event structure
    // Typical event: name (1.8em) + time (2em) + padding (~1.2em) = ~5em
    const estimatedRowHeightEm = 5;
    const baseFontSize = 16;
    const estimatedRowHeightPx = estimatedRowHeightEm * baseFontSize;

    // Calculate height scale
    const columnHeaderHeightPx = 3 * baseFontSize; // ~3em for column header
    const columnPaddingPx = 2 * baseFontSize; // ~2em for padding
    const requiredContentHeight =
      columnHeaderHeightPx +
      columnPaddingPx +
      (maxEventsInColumn * estimatedRowHeightPx);

    const heightScale = availableHeight / requiredContentHeight;

    // Take the more limiting factor
    let baseContentScale = Math.min(widthScale, heightScale);

    // Apply upper bound: content shouldn't exceed title size
    // This prevents event text from being larger than the main title
    // Using a more generous bound (1.2x header) to allow larger text with few events
    const upperBound = finalHeaderScale * 1.2;
    baseContentScale = Math.min(baseContentScale, upperBound);

    // Apply user zoom
    const finalContentScale = baseContentScale * zoomLevel;

    // Enforce minimum scale
    const minScale = 0.1;
    setHeaderScale(Math.max(finalHeaderScale, minScale));
    setContentScale(Math.max(finalContentScale, minScale));
  }, [containerWidth, containerHeight, headerHeight, columns, events, zoomLevel]);

  // Debounced effect to recalculate scales
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      calculateScales();
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [calculateScales]);

  // Also calculate immediately on mount
  useEffect(() => {
    calculateScales();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { headerScale, contentScale };
};
