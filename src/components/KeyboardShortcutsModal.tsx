import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close modals, clear search' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['↑', '↓'], description: 'Navigate through items' },
        { keys: ['←', '→'], description: 'Expand/collapse folders' },
        { keys: ['Enter', 'Space'], description: 'Select item' },
        { keys: ['Home'], description: 'Jump to first item' },
        { keys: ['End'], description: 'Jump to last item' },
      ],
    },
    {
      category: 'Folder Actions',
      items: [
        { keys: ['F2'], description: 'Rename selected folder' },
        { keys: ['Delete'], description: 'Delete selected folder' },
        { keys: ['Ctrl', 'P'], description: 'Pin/unpin folder' },
        { keys: ['Right Click'], description: 'Open context menu' },
      ],
    },
    {
      category: 'Search',
      items: [
        { keys: ['Ctrl', 'F'], description: 'Focus search box' },
        { keys: ['Esc'], description: 'Clear search' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-600" />
            <h2 id="shortcuts-title" className="text-xl font-bold text-gray-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono mx-1">?</kbd>
            anytime to view this help
          </p>
        </div>
      </div>
    </div>
  );
};
