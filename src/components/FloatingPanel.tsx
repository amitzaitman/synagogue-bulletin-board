import React, { useState, useRef, useEffect } from 'react';

interface FloatingPanelProps {
  children: React.ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ children, title, isOpen }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [position, setPosition] = useState({ 
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 250
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPosition({
        x: window.innerWidth / 2 - rect.width / 2,
        y: window.innerHeight / 2 - rect.height / 2,
      });
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
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    setInitialMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (isResizing && panelRef.current) {
      const newWidth = size.width + (e.clientX - initialMousePos.x);
      const newHeight = size.height + (e.clientY - initialMousePos.y);
      setSize({
        width: newWidth > 200 ? newWidth : 200,
        height: newHeight > 200 ? newHeight : 200,
      });
      setInitialMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, offset]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fixed bg-stone-100/90 backdrop-blur-lg shadow-2xl rounded-lg z-40 overflow-hidden"
      style={{ top: position.y, left: position.x, width: size.width, height: size.height }}
    >
      <div
        className="p-2 bg-stone-200/90 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-stone-800">{title}</span>
      </div>
      <div className="overflow-y-auto" style={{ height: `calc(${size.height}px - 40px)` }}>
        {children}
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default FloatingPanel;
