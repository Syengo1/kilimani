'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Pass initial state to useState so the server and first client render match perfectly
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wrap the entire read and update process in a macro-task.
    // This satisfies ESLint, prevents cascading renders, and batches the state updates.
    const timer = setTimeout(() => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.warn('Error reading localStorage', error);
      } finally {
        // Guarantee hydration state flips to true, even if localStorage reading fails
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [key]);

  // Memoize the setter function so it doesn't cause unnecessary re-renders in child components
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, isHydrated] as const;
}