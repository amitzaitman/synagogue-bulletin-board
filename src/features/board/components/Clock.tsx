import React, { useState, useEffect } from 'react';
import HebrewDate from './HebrewDate';

import { BoardSettings } from '../../../shared/types/types';

interface ClockProps {
  settings: BoardSettings;
  scale?: number; // Scale factor for proportional sizing
}

const Clock: React.FC<ClockProps> = ({ settings, scale = 1 }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const baseFontSize = 16; // Base font size in pixels
  const scaledFontSize = baseFontSize * scale;

  return (
    <div
      className="inline-flex flex-col items-center leading-none font-mono font-bold text-stone-800 tracking-wider rounded-lg shadow-sm border border-black/5"
      style={{
        backgroundColor: settings.clockBackgroundColor,
        padding: `${scale * 8}px`,
        fontSize: `${3 * scaledFontSize}px`
      }}
    >
      <div>{time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
      <HebrewDate scale={scale} />
    </div>
  );
};

export default Clock;