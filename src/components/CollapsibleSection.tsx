import React, { useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  count,
  actions,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-t border-gray-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left group"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <span className="flex-1 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-xs font-medium text-gray-500">{count}</span>
        )}
        {actions && (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-2 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
