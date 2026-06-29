'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { toast } from 'sonner';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
}

export function POSPaymentModal({ isOpen, onClose, cashierId }: POSPaymentModalProps) {
  const { activeTicket, processOfflineCheckout } = usePOSStore();
  const [cashAmount, setCashAmount] = useState<string>('');
  const [mpesaAmount, setMpesaAmount] = useState<string>('');
  const [mpesaCode, setMpesaCode] = useState<string>('');

  const totalDue = useMemo(() => activeTicket.reduce((total, item) => total + (item.price * item.quantity), 0), [activeTicket]);
  const cashNum = Number(cashAmount) || 0;
  const mpesaNum = Number(mpesaAmount) || 0;
  const totalTendered = cashNum + mpesaNum;
  const balance = totalDue - totalTendered;
  const changeDue = totalTendered > totalDue ? totalTendered - totalDue : 0;
  
  const canCheckout = totalTendered >= totalDue && totalDue > 0 && (mpesaNum === 0 || mpesaCode.length >= 8);

  const handleCompleteSale = () => {
    if (!canCheckout) return;
    
    // We adjust the cash amount down if they gave us extra (change), so the DB records exact revenue.
    const finalCashRecorded = cashNum > 0 ? cashNum - changeDue : 0;
    
    processOfflineCheckout(cashierId, finalCashRecorded, mpesaNum, mpesaCode);
    toast.success('Sale completed successfully!');
    
    // Reset Modal State
    setCashAmount(''); setMpesaAmount(''); setMpesaCode('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-background border border-border/50 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 bg-stone-50 dark:bg-stone-900 border-b border-border/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-serif font-black">Complete Sale</h2>
                <p className="text-xs font-mono text-muted-foreground mt-1">Total Due: KES {totalDue.toLocaleString()}</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Split Payment Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Banknote size={14} /> Cash Tendered</label>
                  <input 
                    type="number" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full p-4 bg-foreground/5 border-none rounded-xl text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Smartphone size={14} /> M-Pesa Amount</label>
                  <input 
                    type="number" placeholder="0" value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)}
                    className="w-full p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none rounded-xl text-xl font-black focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>

              {/* M-Pesa Receipt Code (Only shows if M-Pesa > 0) */}
              <AnimatePresence>
                {mpesaNum > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Safaricom Receipt Code</label>
                    <input 
                      type="text" placeholder="e.g. QKT5ABCDEF" value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                      className="w-full p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500/50 outline-none placeholder:text-emerald-500/30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Financial Math Summary */}
              <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl space-y-2 border border-border/50">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Due</span><span className="font-bold">KES {totalDue.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tendered</span><span className="font-bold">KES {totalTendered.toLocaleString()}</span></div>
                <div className="border-t border-border/50 my-2 pt-2 flex justify-between">
                  {balance > 0 ? (
                     <><span className="text-destructive font-bold text-sm">Remaining Balance</span><span className="text-destructive font-black">KES {balance.toLocaleString()}</span></>
                  ) : (
                     <><span className="text-emerald-600 font-bold text-sm">Change Due</span><span className="text-emerald-600 font-black">KES {changeDue.toLocaleString()}</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 bg-background">
              <button
                disabled={!canCheckout} onClick={handleCompleteSale}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-black tracking-wide transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={24} /> Complete Sale
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}