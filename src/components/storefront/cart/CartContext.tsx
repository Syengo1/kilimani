'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { validateCartItems } from '@/app/actions/cart';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string; // Added for robust tracking
  price: number; // The active selling price (what they actually pay)
  originalPrice?: number; // The non-discounted base price (if on sale)
  quantity: number;
  image: string;
  length?: string; 
  
  // Enterprise Stale Data Tracking
  isStale?: boolean;
  staleReason?: 'OUT_OF_STOCK' | 'PRICE_CHANGED' | 'INSUFFICIENT_STOCK';
  liveStock?: number;
  livePrice?: number;
  liveOriginalPrice?: number; 
}

interface CartStore {
  items: CartItem[];
  isHydrated: boolean;
  isValidating: boolean;
  
  // Actions
  setHydrated: (state: boolean) => void;
  addToCart: (item: Omit<CartItem, 'isStale' | 'staleReason' | 'liveStock' | 'livePrice' | 'liveOriginalPrice'>) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  acceptPriceChanges: (variantId: string, newPrice: number, newOriginalPrice?: number) => void;
  clearCart: () => void;
  validateCart: () => Promise<void>;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      isValidating: false,

      setHydrated: (state) => set({ isHydrated: state }),

      addToCart: (newItem) => set((state) => {
        const existing = state.items.find(i => i.variantId === newItem.variantId);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.variantId === newItem.variantId 
                ? { ...i, quantity: i.quantity + newItem.quantity } 
                : i
            )
          };
        }
        return { items: [...state.items, newItem] };
      }),

      removeFromCart: (variantId) => set((state) => ({
        items: state.items.filter(i => i.variantId !== variantId)
      })),

      updateQuantity: (variantId, quantity) => set((state) => {
        if (quantity < 1) {
          return { items: state.items.filter(i => i.variantId !== variantId) };
        }
        return {
          items: state.items.map(i => i.variantId === variantId ? { ...i, quantity } : i)
        };
      }),

      acceptPriceChanges: (variantId, newPrice, newOriginalPrice) => set((state) => ({
        items: state.items.map(i => i.variantId === variantId 
          ? { 
              ...i, 
              price: newPrice, 
              originalPrice: newOriginalPrice, 
              isStale: false, 
              staleReason: undefined, 
              livePrice: undefined,
              liveOriginalPrice: undefined 
            } 
          : i
        )
      })),

      clearCart: () => set({ items: [] }),

      validateCart: async () => {
        const { items, isValidating } = get();
        if (items.length === 0 || isValidating) return;
        
        set({ isValidating: true });
        
        try {
          const payload = items.map(i => ({ variantId: i.variantId, price: i.price, quantity: i.quantity }));
          const results = await validateCartItems(payload);
          
          set((state) => ({
            items: state.items.map(item => {
              const validation = results.find(r => r.variantId === item.variantId);
              
              if (!validation || validation.isValid) {
                return { 
                  ...item, 
                  isStale: false, 
                  staleReason: undefined, 
                  liveStock: validation?.liveStock, 
                  livePrice: undefined,
                  liveOriginalPrice: undefined
                };
              }
              
              return { 
                ...item, 
                isStale: true, 
                staleReason: validation.error as CartItem['staleReason'],
                liveStock: validation.liveStock,
                livePrice: validation.livePrice,
                // Assumes your updated backend validation returns the live original price if it changed
                liveOriginalPrice: validation.liveOriginalPrice 
              };
            })
          }));
        } catch (error) {
          console.error('Validation failed:', error);
        } finally {
          set({ isValidating: false });
        }
      }
    }),
    {
      name: 'kilimani_cart', 
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);