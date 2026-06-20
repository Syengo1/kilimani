'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { validateCartItems } from '@/app/actions/cart'; // Ensure this action returns livePrice and liveStock

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  length?: string; 
  
  // Stale Data Tracking
  isStale?: boolean;
  staleReason?: 'OUT_OF_STOCK' | 'PRICE_CHANGED' | 'INSUFFICIENT_STOCK';
  liveStock?: number;
  livePrice?: number;
}

interface CartContextType {
  items: CartItem[];
  isHydrated: boolean;
  isValidating: boolean;
  hasStaleData: boolean;
  addToCart: (item: Omit<CartItem, 'isStale' | 'staleReason' | 'liveStock' | 'livePrice'>) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  validateCart: () => Promise<void>;
  acceptPriceChanges: (variantId: string, newPrice: number) => void;
  clearCart: () => void; // Crucial for post-checkout cleanup
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // 1. HYDRATION & CROSS-TAB SYNC ENGINE
  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = localStorage.getItem('kilimani_cart');
        if (saved) setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Cart parse failure. Resetting cart to prevent crash.', e);
        localStorage.removeItem('kilimani_cart');
      }
    };

    loadCart();

    // FIX 1: Prevent synchronous setState in effect (Cascading Renders warning)
    // Defers the hydration state update to the macrotask queue.
    const timer = setTimeout(() => setIsHydrated(true), 0);

    // Listen for changes from other tabs to keep the cart perfectly synced
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kilimani_cart') loadCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timer); // Clean up the timer to prevent memory leaks
    };
  }, []);

  // 2. AUTO-SAVE ENGINE
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('kilimani_cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // 3. THE VALIDATION ENGINE (Hooks into your secure Server Action)
  const validateCart = useCallback(async () => {
    if (items.length === 0) return;
    setIsValidating(true);
    
    try {
      // Sends a lightweight payload to the server to verify prices and stock
      const results = await validateCartItems(items.map(i => ({ variantId: i.variantId, price: i.price, quantity: i.quantity })));
      
      setItems(prevItems => prevItems.map(item => {
        const validation = results.find(r => r.variantId === item.variantId);
        
        if (!validation || validation.isValid) {
          return { ...item, isStale: false, staleReason: undefined, liveStock: validation?.liveStock, livePrice: undefined };
        }
        
        return { 
          ...item, 
          isStale: true, 
          // FIX 2: Strict Typing - Pulls the exact allowed string literals from the interface
          staleReason: validation.error as CartItem['staleReason'],
          liveStock: validation.liveStock,
          livePrice: validation.livePrice 
        };
      }));
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [items]);

  // Validate when returning to the tab (protects against items selling out while the user was away)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') validateCart();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [validateCart]);

  // 4. CART MUTATIONS
  const addToCart = (newItem: Omit<CartItem, 'isStale' | 'staleReason' | 'liveStock' | 'livePrice'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === newItem.variantId);
      if (existing) {
        return prev.map(i => i.variantId === newItem.variantId 
          ? { ...i, quantity: i.quantity + newItem.quantity } 
          : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (variantId: string) => setItems(prev => prev.filter(i => i.variantId !== variantId));
  
  const clearCart = () => setItems([]);

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(variantId);
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, quantity } : i));
  };

  const acceptPriceChanges = (variantId: string, newPrice: number) => {
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, price: newPrice, isStale: false, staleReason: undefined, livePrice: undefined } : i));
  };

  const hasStaleData = items.some(i => i.isStale);

  return (
    <CartContext.Provider value={{ 
      items, isHydrated, isValidating, hasStaleData, 
      addToCart, removeFromCart, updateQuantity, clearCart, validateCart, acceptPriceChanges 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};