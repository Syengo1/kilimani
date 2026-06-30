'use client';

import { POSLayout } from '@/components/pos/layout/POSLayout';
import { POSCatalog } from '@/components/pos/catalog/POSCatalog';
import { POSRegister } from '@/components/pos/register/POSRegister';
import { usePOSStore } from '@/components/pos/store/posStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

interface POSClientProps {
  cashierName: string;
  cashierId: string; // <-- ADDED STRICT ID PROP
}

export function POSClient({ cashierName, cashierId }: POSClientProps) {
  const { isCartOpen, setIsCartOpen, activeTicket } = usePOSStore();

  return (
    <POSLayout cashierName={cashierName}>
      
      {/* 1. THE CATALOG */}
      <div className="flex-1 bg-white dark:bg-card h-full w-full relative z-10 transition-all duration-500">
        <POSCatalog />
        
        {/* Floating Cart Button for Mobile */}
        {!isCartOpen && activeTicket.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="absolute bottom-6 right-6 md:hidden flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-2xl z-50 animate-bounce"
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            <span className="font-black text-sm">{activeTicket.length}</span>
          </button>
        )}
      </div>

      {/* 2. THE SLIDING REGISTER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Mobile Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="md:hidden absolute inset-0 bg-background/60 backdrop-blur-sm z-30"
            />
            
            {/* The Slide-in Register */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute md:relative right-0 top-0 bottom-0 w-[90%] md:w-[400px] lg:w-[450px] h-full shrink-0 z-40 bg-background shadow-[-10px_0_40px_rgba(0,0,0,0.1)] md:shadow-none"
            >
              {/* FED DIRECTLY INTO THE REGISTER */}
              <POSRegister cashierId={cashierId} /> 
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </POSLayout>
  );
}