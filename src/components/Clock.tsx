import React, { useState, useEffect } from 'react';
import HebrewDate from './HebrewDate';

import { BoardSettings } from '../types';

interface ClockProps {
  settings: BoardSettings;
}

const Clock: React.FC<ClockProps> = ({ settings }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div className="inline-flex flex-col items-center text-[3em] leading-none font-mono font-bold text-stone-800 tracking-wider p-2 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: settings.clockBackgroundColor }}>
      <div>{time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
      <HebrewDate />
    </div>
  );
};

export default Clock;