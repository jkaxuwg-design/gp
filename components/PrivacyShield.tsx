import React, { useEffect, useState } from 'react';
import { Shield, WifiOff, Globe, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const PrivacyShield: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`
      flex items-center gap-3 px-4 py-2 rounded-full border border-dashed transition-colors duration-500
      ${isOnline 
        ? 'bg-industrial-900/50 border-industrial-700 text-industrial-400' 
        : 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'}
    `}>
      <div className="relative">
        <Shield size={18} className={isOnline ? "text-industrial-500" : "text-emerald-500"} />
        {!isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-2 h-2 rounded-full animate-pulse" />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-mono font-bold uppercase tracking-wider">
          {isOnline ? t('privacy_active') : t('offline_mode')}
        </span>
      </div>
      
      {isOnline ? (
        <Globe size={14} className="opacity-50" />
      ) : (
        <WifiOff size={14} className="opacity-50" />
      )}
    </div>
  );
};