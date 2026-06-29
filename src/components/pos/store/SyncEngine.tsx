'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePOSStore } from './posStore';
import { syncOfflineOrders } from '@/app/actions/pos';
import { toast } from 'sonner';

export function SyncEngine() {
  const { syncQueue, dequeueOrder, setSyncing, isSyncing } = usePOSStore();
  
  // FIX 1: Lazy Initialization. This checks the browser status securely on the first render,
  // completely eliminating the ESLint cascading render warning.
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Fallback for Server Side Rendering
  });

  // Network connection monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored. System online.');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. Operating in Offline Mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // The Sync Processor
  const processQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;

    setSyncing(true);
    try {
      // Send the entire queue to the server
      const results = await syncOfflineOrders(syncQueue);

      let successCount = 0;
      results.forEach((res) => {
        if (res.success) {
          dequeueOrder(res.localId); // Remove successfully synced orders
          successCount++;
        }
      });

      if (successCount > 0) {
        // FIX 2: Actively use the toast notification!
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        toast.success(`Successfully synced ${successCount} offline order(s) to the server.`);
      }

    } catch (error) {
      console.error('[Sync Engine] Critical failure:', error);
      toast.error('Background sync failed. Will retry later.');
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncQueue, isSyncing, dequeueOrder, setSyncing]);

  // Trigger sync automatically when coming back online, when queue changes, or on custom event
  useEffect(() => {
    processQueue();
    
    // Listen for manual triggers from the POS Store
    const handleTrigger = () => processQueue();
    window.addEventListener('trigger-pos-sync', handleTrigger);
    
    return () => window.removeEventListener('trigger-pos-sync', handleTrigger);
  }, [isOnline, syncQueue.length, processQueue]);

  // This is a headless component, it renders absolutely nothing to the UI.
  return null; 
}