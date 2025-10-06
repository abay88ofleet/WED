import React, { useState } from 'react';
import { Search, Upload, Bell, User, Settings, Sparkles, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeStatusIndicator } from './RealtimeStatusIndicator';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { filters, setSearchQuery, setUploadModalOpen, setSelectedDocument } = useDocumentStore();
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Scan & Upload', path: '/upload' },
    { name: 'Browse Archives', path: '/documents' },
    { name: 'Workflow & Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Archi-Scan</h1>
          </button>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActivePath(item.path)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <RealtimeStatusIndicator />

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSelectDocument={(doc) => setSelectedDocument(doc)}
      />
    </header>
  );
};
