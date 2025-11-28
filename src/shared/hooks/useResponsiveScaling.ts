import { useState, useEffect, useCallback, useRef } from 'react';
import { Column, EventItem, BoardSettings } from '../types/types';
import { LAYOUT_CONSTANTS } from '../constants/layout';

interface UseResponsiveScalingProps {
  containerWidth: number;
  containerHeight: number;
  columns: Column[];
  events: EventItem[];
  settings: BoardSettings;
}

interface ScalingResult {
  contentScale: number;
}

const DEBOUNCE_MS = 100;

export const useResponsiveScaling = ({
  containerWidth,
  containerHeight,
  columns,
  events,
  settings,
}: UseResponsiveScalingProps): ScalingResult => {
  const [contentScale, setContentScale] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  // Create measurement container on mount
  useEffect(() => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.height = 'auto';
    div.style.width = 'auto';
    div.style.whiteSpace = 'normal';
    div.style.top = '-9999px';
    div.style.left = '-9999px';
    div.style.boxSizing = 'border-box';
    document.body.appendChild(div);
    measureRef.current = div;

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  const calculateScales = useCallback(() => {
    if (containerWidth === 0 || containerHeight === 0 || !measureRef.current || columns.length === 0) {
      return;
    }

    // Calculate available height - we use the full container height
    const availableHeight = containerHeight;

    if (availableHeight <= 0) return;

    // Find heaviest column
    const heaviestColumn = columns.reduce((prev, current) => {
      const prevEvents = events.filter(e => e.columnId === prev.id);
      const currEvents = events.filter(e => e.columnId === current.id);
      const getWeight = (evs: EventItem[]) => evs.reduce((sum, e) => sum + 50 + (e.name?.length || 0), 0);
      return getWeight(currEvents) > getWeight(prevEvents) ? current : prev;
    }, columns[0]);

    if (!heaviestColumn) return;

    const targetEvents = events.filter(e => e.columnId === heaviestColumn.id).sort((a, b) => a.order - b.order);

    // Calculate column width
    const numColumns = columns.length;
    const gapTotal = (numColumns - 1) * LAYOUT_CONSTANTS.GRID.GAP_PX;
    const paddingTotal = LAYOUT_CONSTANTS.GRID.PADDING_PX * 2;
    const columnWidth = (containerWidth - paddingTotal - gapTotal) / numColumns;

    const measureHeightAtScale = (scale: number) => {
      if (!measureRef.current) return Infinity;
      const container = measureRef.current;
      container.innerHTML = '';
      container.style.width = `${columnWidth}px`; // We measure in a column-width box, but we add header height on top
      container.style.display = 'flex';
      container.style.flexDirection = 'column';

      // 1. Simulate Main Header Height
      const headerPadding = LAYOUT_CONSTANTS.HEADER.PADDING_PX * 2 * scale; // p-4 scaled (top+bottom)
      const titleFontSize = settings.mainTitleSize * LAYOUT_CONSTANTS.HEADER.TITLE_SCALE_FACTOR * scale;
      const headerHeight = titleFontSize * 1.5 + headerPadding;

      // 2. Column Header
      const colHeaderPadding = LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_Y_PX * 2 * scale; // py-3 (12px) * 2 = 24px
      const colTitleFontSize = settings.columnTitleSize * LAYOUT_CONSTANTS.COLUMN.TITLE_SCALE_FACTOR * scale;
      const colHeaderHeight = colTitleFontSize * 1.5 + colHeaderPadding;

      // 3. Events
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexDirection = 'column';

      targetEvents.forEach(event => {
        const row = document.createElement('div');
        const py = LAYOUT_CONSTANTS.EVENT.PADDING_Y_PX * scale;
        const px = LAYOUT_CONSTANTS.EVENT.PADDING_X_PX * scale;
        row.style.padding = `${py}px ${px}px`;
        row.style.borderBottom = '1px solid #eee';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';

        const fontSize = settings.eventTextScale * LAYOUT_CONSTANTS.EVENT.TEXT_SCALE_FACTOR * scale;
        row.style.fontSize = `${fontSize}px`;
        row.style.lineHeight = '1.5';

        const name = document.createElement('span');
        name.innerText = event.name;
        name.style.flex = '1';

        const time = document.createElement('span');
        time.innerText = '00:00';
        time.style.fontWeight = 'bold';

        row.appendChild(name);
        row.appendChild(time);
        list.appendChild(row);
      });

      container.appendChild(list);

      // Total Height = Header + Top Padding + ColumnHeader + EventsList + Bottom Padding
      const paddingY = LAYOUT_CONSTANTS.GRID.PADDING_PX * scale;

      return headerHeight + paddingY + colHeaderHeight + container.scrollHeight + paddingY;
    };

    // Binary Search
    let min = 0.1;
    let max = 5.0;
    let optimal = min;

    for (let i = 0; i < 64; i++) {
      const mid = (min + max) / 2;
      const height = measureHeightAtScale(mid);
      if (height > availableHeight) {
        max = mid;
      } else {
        optimal = mid;
        min = mid;
      }
    }

    setContentScale(optimal);
  }, [containerWidth, containerHeight, columns, events, settings]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(calculateScales, DEBOUNCE_MS);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [calculateScales]);

  return { contentScale };
};
