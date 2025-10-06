import { useState, useEffect, useCallback, useRef } from 'react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UseContextMenuReturn<T> {
  isOpen: boolean;
  position: ContextMenuPosition;
  data: T | null;
  openContextMenu: (event: React.MouseEvent, contextData: T) => void;
  closeContextMenu: () => void;
}

export function useContextMenu<T = any>(): UseContextMenuReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [data, setData] = useState<T | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openContextMenu = useCallback((event: React.MouseEvent, contextData: T) => {
    event.preventDefault();
    event.stopPropagation();

    const x = event.clientX;
    const y = event.clientY;

    setPosition({ x, y });
    setData(contextData);
    setIsOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    const handleScroll = () => {
      closeContextMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeContextMenu]);

  return {
    isOpen,
    position,
    data,
    openContextMenu,
    closeContextMenu,
  };
}
