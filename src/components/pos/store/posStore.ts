'use client';

import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// 1. CENTRALIZED TYPES
export interface POSVariant {
  id: string;
  sku: string;
  price_kes: number | string;
  discount_price_kes?: number | string | null;
  stock_quantity: number;
  variant_attributes?: { length?: string; [key: string]: string | undefined; };
}

export interface POSProduct {
  id: string;
  ref_id: string; // Added Parent SKU for easy IDing
  title: string; 
  product_type?: string;
  images?: { url: string; display_order?: number }[];
  variants: POSVariant[];
}

export interface POSCartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  maxStock: number; // 🔥 NEW: The absolute inventory ceiling
}

export interface OfflineOrderPayload {
  localId: string; 
  cashierId: string;
  items: { variant_id: string; quantity: number; unit_price: number }[];
  amountCash: number;
  amountMpesa: number;
  mpesaReceipt?: string;
  timestamp: string;
}

const idbStorage: StateStorage = {
  getItem: async (name: string) => (await get(name)) || null,
  setItem: async (name: string, value: string) => await set(name, value),
  removeItem: async (name: string) => await del(name),
};

interface POSStore {
  catalog: POSProduct[];
  lastSyncedAt: string | null;
  syncQueue: OfflineOrderPayload[];
  isSyncing: boolean;
  activeTicket: POSCartItem[];
  isCartOpen: boolean; // Controls the sliding register
  
  setCatalog: (products: POSProduct[]) => void;
  addToTicket: (item: POSCartItem) => void;
  removeFromTicket: (variantId: string) => void;
  updateTicketQuantity: (variantId: string, quantity: number) => void;
  clearTicket: () => void;
  setIsCartOpen: (isOpen: boolean) => void; 
  
  processOfflineCheckout: (cashierId: string, amountCash: number, amountMpesa: number, mpesaReceipt?: string) => void;
  dequeueOrder: (localId: string) => void;
  setSyncing: (status: boolean) => void;
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      catalog: [],
      lastSyncedAt: null,
      syncQueue: [],
      isSyncing: false,
      activeTicket: [],
      isCartOpen: false,

      setCatalog: (products) => set({ catalog: products, lastSyncedAt: new Date().toISOString() }),

      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

      addToTicket: (newItem) => set((state) => {
        const existing = state.activeTicket.find(i => i.variantId === newItem.variantId);
        
        if (existing) {
          // 🔥 FIREWALL: Mathematically prevent quantity from exceeding maxStock on rapid taps
          const safelyCappedQuantity = Math.min(existing.quantity + newItem.quantity, existing.maxStock);
          
          return {
            isCartOpen: true, // Auto-open cart
            activeTicket: state.activeTicket.map(i =>
              i.variantId === newItem.variantId ? { ...i, quantity: safelyCappedQuantity } : i
            )
          };
        }
        
        // 🔥 FIREWALL: Ensure new items also respect their max stock on the very first tap
        const safelyCappedNewItem = { ...newItem, quantity: Math.min(newItem.quantity, newItem.maxStock) };
        return { isCartOpen: true, activeTicket: [...state.activeTicket, safelyCappedNewItem] };
      }),

      removeFromTicket: (variantId) => set((state) => {
        const newTicket = state.activeTicket.filter(i => i.variantId !== variantId);
        return { activeTicket: newTicket, isCartOpen: newTicket.length > 0 };
      }),

      updateTicketQuantity: (variantId, quantity) => set((state) => {
        if (quantity < 1) {
           const newTicket = state.activeTicket.filter(i => i.variantId !== variantId);
           return { activeTicket: newTicket, isCartOpen: newTicket.length > 0 };
        }
        return {
          activeTicket: state.activeTicket.map(i => {
            if (i.variantId === variantId) {
               // 🔥 FIREWALL: Prevent manual +/- buttons from exceeding limits
               return { ...i, quantity: Math.min(quantity, i.maxStock) };
            }
            return i;
          })
        };
      }),

      clearTicket: () => set({ activeTicket: [], isCartOpen: false }),

      processOfflineCheckout: (cashierId, amountCash, amountMpesa, mpesaReceipt) => {
        const { activeTicket, syncQueue, catalog } = get();
        if (activeTicket.length === 0) return;

        const payload: OfflineOrderPayload = {
          localId: crypto.randomUUID(), 
          cashierId, amountCash, amountMpesa,
          mpesaReceipt: mpesaReceipt?.toUpperCase(),
          timestamp: new Date().toISOString(),
          items: activeTicket.map(item => ({ variant_id: item.variantId, quantity: item.quantity, unit_price: item.price }))
        };

        const updatedCatalog = catalog.map(product => ({
          ...product,
          variants: product.variants.map(variant => {
            const soldItem = activeTicket.find(t => t.variantId === variant.id);
            if (soldItem) return { ...variant, stock_quantity: Math.max(0, variant.stock_quantity - soldItem.quantity) };
            return variant;
          })
        }));

        set({ activeTicket: [], isCartOpen: false, catalog: updatedCatalog, syncQueue: [...syncQueue, payload] });

        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('trigger-pos-sync'));
      },

      dequeueOrder: (localId) => set((state) => ({ syncQueue: state.syncQueue.filter(order => order.localId !== localId) })),
      setSyncing: (status) => set({ isSyncing: status }),
    }),
    { name: 'kilimani-pos-engine', storage: createJSONStorage(() => idbStorage) }
  )
);