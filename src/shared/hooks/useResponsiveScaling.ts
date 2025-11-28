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

      // 1. Measure Main Header Height (using full container width)
      container.style.width = `${containerWidth}px`;
      container.style.boxSizing = 'border-box';

      const titleFontSize = settings.mainTitleSize * LAYOUT_CONSTANTS.HEADER.TITLE_SCALE_FACTOR * scale;
      const headerPadding = titleFontSize * LAYOUT_CONSTANTS.HEADER.PADDING_EM;
      container.style.padding = `${headerPadding}px`;
      container.style.display = 'flex';
      container.style.flexDirection = 'row'; // Explicitly set row
      container.style.justifyContent = 'space-between';
      container.style.alignItems = 'center';

      // Clock Section (Left)
      const clockDiv = document.createElement('div');
      clockDiv.style.boxSizing = 'border-box';
      clockDiv.style.display = 'flex';
      clockDiv.style.flexDirection = 'column';
      clockDiv.style.alignItems = 'flex-start';
      clockDiv.style.width = '25%';

      const clockInner = document.createElement('div');
      clockInner.style.boxSizing = 'border-box';
      clockInner.style.fontSize = `${LAYOUT_CONSTANTS.HEADER.CLOCK_FONT_SIZE_REM * scale}rem`;
      clockInner.style.padding = `${LAYOUT_CONSTANTS.HEADER.CLOCK_PADDING_Y_EM}em ${LAYOUT_CONSTANTS.HEADER.CLOCK_PADDING_X_EM}em`;
      clockInner.innerText = '00:00:00';
      clockDiv.appendChild(clockInner);
      container.appendChild(clockDiv);

      // Title Section (Center)
      const titleDiv = document.createElement('div');
      titleDiv.style.boxSizing = 'border-box';
      titleDiv.style.width = '50%';
      titleDiv.style.textAlign = 'center';
      titleDiv.style.fontSize = `${titleFontSize}px`;
      titleDiv.style.fontWeight = 'bold';
      titleDiv.style.lineHeight = '1.5';
      titleDiv.innerText = settings.boardTitle || '';
      container.appendChild(titleDiv);

      // Date Section (Right)
      const dateDiv = document.createElement('div');
      dateDiv.style.boxSizing = 'border-box';
      dateDiv.style.display = 'flex';
      dateDiv.style.flexDirection = 'column';
      dateDiv.style.alignItems = 'flex-end';
      dateDiv.style.width = '25%';

      const dateInner = document.createElement('div');
      dateInner.style.boxSizing = 'border-box';
      dateInner.style.fontSize = `${LAYOUT_CONSTANTS.HEADER.DATE_FONT_SIZE_REM * scale}rem`;
      dateInner.style.fontWeight = 'bold';
      dateInner.innerText = 'Date';
      dateDiv.appendChild(dateInner);

      const parshaInner = document.createElement('div');
      parshaInner.style.boxSizing = 'border-box';
      parshaInner.style.fontSize = `${LAYOUT_CONSTANTS.HEADER.PARSHA_FONT_SIZE_REM * scale}rem`;
      parshaInner.innerText = 'Parsha';
      dateDiv.appendChild(parshaInner);

      container.appendChild(dateDiv);

      const headerHeight = container.scrollHeight;

      // Reset for column measurement
      container.innerHTML = '';
      container.style.width = `${columnWidth}px`;
      container.style.padding = '0';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.boxSizing = 'border-box';

      // 2. Column Header
      const colHeaderPadding = LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_Y_PX * 2 * scale; // py-3 (12px) * 2 = 24px
      const colTitleFontSize = settings.columnTitleSize * LAYOUT_CONSTANTS.COLUMN.TITLE_SCALE_FACTOR * scale;
      const colHeaderHeight = colTitleFontSize * 1.5 + colHeaderPadding;

      // 3. Events
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.boxSizing = 'border-box';

      targetEvents.forEach(event => {
        const row = document.createElement('div');
        row.style.boxSizing = 'border-box';
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
      const totalHeight = headerHeight + paddingY + colHeaderHeight + container.scrollHeight + paddingY;

      console.log(`Scale: ${scale}, Header: ${headerHeight}, ColHeader: ${colHeaderHeight}, Events: ${container.scrollHeight}, Total: ${totalHeight}, Available: ${availableHeight}`);
      return totalHeight;
    };

    // Binary Search
    let min = 0.01;
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
