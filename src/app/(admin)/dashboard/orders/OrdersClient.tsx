'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX 1: Removed unused icons and imported the missing SplitSquareHorizontal icon
import { Search, MonitorSmartphone, Globe, Banknote, Smartphone, Ban, Loader2, RefreshCw, SplitSquareHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { voidAndRestockOrder } from '@/app/actions/orders';

// FIX 2: Strict Interface Definitions (Replacing 'any')
export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_variants?: {
    sku: string;
    products?: {
      id: string;
      ref_id: string;
      product_type: string;
      base_attributes?: Record<string, unknown>; // <--- THE FIX IS HERE
      product_images?: { url: string }[];
    };
  };
}

export interface Order {
  id: string;
  order_ref: string;
  customer_name: string;
  origin: 'pos' | 'web';
  payment_method: 'cash' | 'mpesa' | 'split' | 'online';
  mpesa_receipt?: string;
  total_amount: number;
  status: string;
  created_at: string;
  cashier?: {
    full_name: string;
  };
  order_items?: OrderItem[];
}

type OrdersClientProps = {
  initialOrders: Order[]; // Applied the strict Order interface
  isAdmin: boolean;
};

export function OrdersClient({ initialOrders, isAdmin }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'pos' | 'web'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'mpesa' | 'split' | 'online'>('all');
  
  const [isVoiding, setIsVoiding] = useState<string | null>(null);

  // ==========================================
  // SMART FILTERING ENGINE
  // ==========================================
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = search.toLowerCase();
      const matchesSearch = 
        order.order_ref?.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.mpesa_receipt?.toLowerCase().includes(q);
      
      const matchesOrigin = originFilter === 'all' || order.origin === originFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;

      return matchesSearch && matchesOrigin && matchesPayment;
    });
  }, [orders, search, originFilter, paymentFilter]);

  // ==========================================
  // AWARE ANALYTICS (Excludes Voided/Cancelled)
  // ==========================================
  const stats = useMemo(() => {
    const valid = filteredOrders.filter(o => o.status !== 'cancelled');
    return {
      totalRevenue: valid.reduce((sum, o) => sum + Number(o.total_amount), 0),
      validCount: valid.length,
      voidedCount: filteredOrders.length - valid.length,
      posRevenue: valid.filter(o => o.origin === 'pos').reduce((sum, o) => sum + Number(o.total_amount), 0),
      webRevenue: valid.filter(o => o.origin === 'web').reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
  }, [filteredOrders]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const handleVoidOrder = async (orderId: string) => {
    const confirm = window.confirm("CRITICAL: Are you sure you want to void this order? This will instantly restock the items and erase the revenue record. This cannot be undone.");
    if (!confirm) return;

    setIsVoiding(orderId);
    toast.loading('Voiding order and restocking inventory...', { id: 'void' });

    const result = await voidAndRestockOrder(orderId);
    
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order voided and inventory restocked!', { id: 'void' });
    } else {
      toast.error(result.error, { id: 'void' });
    }
    setIsVoiding(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 1. ANALYTICS HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valid Revenue</p>
          <p className="text-2xl font-black text-foreground mt-1">KES {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><MonitorSmartphone size={12} /> POS Sales</p>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">KES {stats.posRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5"><Globe size={12} /> Web Sales</p>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">KES {stats.webRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1.5"><Ban size={12} /> Voided Records</p>
          <p className="text-2xl font-black text-destructive mt-1">{stats.voidedCount} Orders</p>
        </div>
      </div>

      {/* 2. SMART FILTER BAR */}
      <div className="bg-background border border-border/50 rounded-2xl p-2 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" placeholder="Search by Ref, Customer, or Receipt..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-foreground/5 border-none rounded-xl text-sm font-semibold focus:ring-2 outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {/* FIX 3: Replaced 'any' with strict string literal casting */}
          <select 
            value={originFilter} onChange={(e) => setOriginFilter(e.target.value as 'all' | 'pos' | 'web')}
            className="py-3 px-4 bg-foreground/5 border-none rounded-xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
          >
            <option value="all">All Origins</option>
            <option value="pos">In-Store POS</option>
            <option value="web">Website</option>
          </select>
          
          {/* FIX 4: Replaced 'any' with strict string literal casting */}
          <select 
            value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'cash' | 'mpesa' | 'split' | 'online')}
            className="py-3 px-4 bg-foreground/5 border-none rounded-xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash Only</option>
            <option value="mpesa">M-Pesa</option>
            <option value="split">Split Pay</option>
          </select>
        </div>
      </div>

      {/* 3. THE DATA TABLE */}
      <div className="bg-background border border-border/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border/50">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Ref</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total</th>
                {isAdmin && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-semibold">No orders found matching your filters.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isVoided = order.status === 'cancelled';
                    
                    return (
                      <motion.tr 
                        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        key={order.id} 
                        className={`transition-colors hover:bg-foreground/[0.01] ${isVoided ? 'bg-destructive/[0.02] opacity-70' : ''}`}
                      >
                        <td className="p-4 align-top">
                          <div className="flex flex-col">
                            <span className={`font-mono font-black text-sm ${isVoided ? 'line-through text-destructive' : 'text-foreground'}`}>
                              {order.order_ref}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{order.customer_name}</span>
                            {order.origin === 'pos' && order.cashier?.full_name && (
                              <span className="text-[10px] text-muted-foreground mt-1">Served by: {order.cashier.full_name}</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          {order.origin === 'pos' ? (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest"><MonitorSmartphone size={10} /> POS</span>
                          ) : (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest"><Globe size={10} /> WEB</span>
                          )}
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1 items-start">
                            {order.payment_method === 'cash' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><Banknote size={12}/> Cash</span>}
                            {order.payment_method === 'mpesa' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><Smartphone size={12}/> M-Pesa</span>}
                            {order.payment_method === 'split' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"><SplitSquareHorizontal size={12}/> Split</span>}
                            
                            {order.mpesa_receipt && <span className="font-mono text-[9px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded">{order.mpesa_receipt}</span>}
                          </div>
                        </td>

                        <td className="p-4 align-top text-right">
                           <div className="flex flex-col items-end">
                             <span className={`font-black text-sm ${isVoided ? 'text-destructive line-through' : 'text-foreground'}`}>
                               KES {Number(order.total_amount).toLocaleString()}
                             </span>
                             {isVoided && <span className="text-[9px] font-black uppercase tracking-widest text-destructive mt-1 border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 rounded">Voided</span>}
                           </div>
                        </td>

                        {isAdmin && (
                          <td className="p-4 align-top text-center">
                            {!isVoided ? (
                              <button 
                                onClick={() => handleVoidOrder(order.id)}
                                disabled={isVoiding === order.id}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                                title="Void Order & Restock Inventory"
                              >
                                {isVoiding === order.id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} strokeWidth={2.5} />}
                              </button>
                            ) : (
                              <span className="inline-flex items-center justify-center p-2 text-destructive/50">
                                <RefreshCw size={16} strokeWidth={2.5} />
                              </span>
                            )}
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}