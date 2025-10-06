import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video as LucideIcon } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  separator?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 8;
      }

      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 8;
      }

      x = Math.max(8, x);
      y = Math.max(8, y);

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault();
              onClose();
            }}
          />
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed z-50 min-w-[200px] rounded-lg bg-white shadow-xl border border-gray-200 py-1 backdrop-blur-xl"
            style={{
              left: `${adjustedPosition.x}px`,
              top: `${adjustedPosition.y}px`,
            }}
          >
            {items.map((item, index) => (
              <div key={item.id}>
                {item.separator && index > 0 && (
                  <div className="h-px bg-gray-200 my-1" />
                )}
                <button
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      onClose();
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : item.destructive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400 font-mono">{item.shortcut}</span>
                  )}
                </button>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
