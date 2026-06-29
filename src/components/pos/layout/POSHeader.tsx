'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, X, ServerCrash, RefreshCw, CloudDownload } from 'lucide-react';
import { usePOSStore } from '../store/posStore';

export function POSHeader({ cashierName }: { cashierName: string }) {
  const router = useRouter();
  const { syncQueue, isSyncing } = usePOSStore();
  
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true; 
  });

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

  const pendingCount = syncQueue.length;

  return (
    <header className="h-16 bg-stone-950 text-white flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-md border-b border-stone-800">
      
      {/* Left: Branding & Connection Status */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-serif font-black tracking-widest hidden md:block">KILIMANI POS</h1>
        
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
              <Wifi size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/20 text-destructive">
              <WifiOff size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-500">
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <ServerCrash size={14} strokeWidth={2.5} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {pendingCount} Pending Sync
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Cashier Info & Exit */}
      <div className="flex items-center gap-3">
        
        {/* NEW: Manual Catalog Sync Button */}
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
            window.dispatchEvent(new CustomEvent('trigger-catalog-sync'));
          }}
          disabled={!isOnline}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 transition-all text-stone-300 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pull latest inventory from Database"
        >
          <CloudDownload size={18} strokeWidth={2.5} />
        </button>

        <div className="hidden md:flex flex-col items-end mx-2">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Active Cashier</span>
          <span className="text-sm font-semibold truncate max-w-[150px]">{cashierName}</span>
        </div>
        
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
            router.push('/dashboard');
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 hover:bg-destructive hover:text-white transition-all text-stone-300 active:scale-95 touch-manipulation"
          title="Exit POS Terminal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}