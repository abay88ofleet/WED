import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { realtimeManager } from '../services/realtimeService';

export const RealtimeStatusIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkConnection = setInterval(() => {
      const status = realtimeManager.getConnectionStatus();
      setIsConnected(status);
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isConnected
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'bg-red-50 text-red-700 hover:bg-red-100'
        }`}
      >
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium">Offline</span>
          </>
        )}
      </button>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in">
          {isConnected
            ? 'Real-time sync active - Changes appear instantly'
            : 'Reconnecting to real-time updates...'}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
};
