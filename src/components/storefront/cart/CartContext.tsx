'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { validateCartItems, CartValidationResult } from '@/app/actions/cart';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  // Stale Data Flags
  isStale?: boolean;
  staleReason?: CartValidationResult['error'];
  liveStock?: number;
}

interface CartContextType {
  items: CartItem[];
  isHydrated: boolean;
  isValidating: boolean;
  hasStaleData: boolean;
  addToCart: (item: Omit<CartItem, 'isStale' | 'staleReason'>) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  validateCart: () => Promise<void>;
  acceptPriceChanges: (variantId: string, newPrice: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // 1. Hydrate from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('kilimani_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
    setIsHydrated(true);
  }, []);

  // 2. Sync to LocalStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('kilimani_cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // 3. The Validation Engine Trigger
  const validateCart = useCallback(async () => {
    if (items.length === 0) return;
    setIsValidating(true);
    
    try {
      const results = await validateCartItems(items.map(i => ({ variantId: i.variantId, price: i.price, quantity: i.quantity })));
      
      setItems(prevItems => prevItems.map(item => {
        const validation = results.find(r => r.variantId === item.variantId);
        if (!validation || validation.isValid) {
          return { ...item, isStale: false, staleReason: undefined, liveStock: validation?.liveStock };
        }
        return { 
          ...item, 
          isStale: true, 
          staleReason: validation.error,
          liveStock: validation.liveStock 
        };
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  }, [items]);

  // Sync state when tab becomes visible (handles cross-tab stale data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') validateCart();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [validateCart]);

  const addToCart = (newItem: Omit<CartItem, 'isStale' | 'staleReason'>) => {
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

  const removeFromCart = (variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(variantId);
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, quantity } : i));
  };

  const acceptPriceChanges = (variantId: string, newPrice: number) => {
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, price: newPrice, isStale: false, staleReason: undefined } : i));
  };

  const hasStaleData = items.some(i => i.isStale);

  return (
    <CartContext.Provider value={{ items, isHydrated, isValidating, hasStaleData, addToCart, removeFromCart, updateQuantity, validateCart, acceptPriceChanges }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};