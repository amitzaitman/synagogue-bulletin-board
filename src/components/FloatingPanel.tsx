import React, { useState, useRef, useEffect } from 'react';

interface FloatingPanelProps {
  children: React.ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ children, title, isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 250
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      setTimeout(() => {
        const rect = panelRef.current?.getBoundingClientRect();
        if (rect) {
          setPosition({
            x: window.innerWidth / 2 - rect.width / 2,
            y: window.innerHeight / 2 - rect.height / 2,
          });
        }
      }, 0);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      setIsDragging(true);
      setOffset({
        x: e.clientX - panelRef.current.offsetLeft,
        y: e.clientY - panelRef.current.offsetTop,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && panelRef.current) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fixed bg-stone-100/90 backdrop-blur-lg shadow-2xl rounded-lg z-40 overflow-hidden"
      style={{ top: position.y, left: position.x }}
    >
      <div
        className="p-2 bg-stone-200/90 rounded-t-lg cursor-move flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-stone-800">{title}</span>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="w-6 h-6 bg-yellow-400 rounded-full hover:bg-yellow-500"></button>
          <button onClick={onClose} className="w-6 h-6 bg-red-500 rounded-full hover:bg-red-600"></button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;

