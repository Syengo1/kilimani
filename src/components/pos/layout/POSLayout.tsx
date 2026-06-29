'use client';

import { ReactNode } from 'react';
import { SyncEngine } from '../store/SyncEngine';
import { CatalogHydrator } from '../store/CatalogHydrator'; // <-- Import Hydrator
import { POSHeader } from './POSHeader';
import { motion } from 'framer-motion';

interface POSLayoutProps {
  children: ReactNode;
  cashierName: string;
}

export function POSLayout({ children, cashierName }: POSLayoutProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-stone-100 dark:bg-background flex flex-col w-full h-[100dvh] overflow-hidden overscroll-none"
    >
      {/* Headless Architecture Layer */}
      <SyncEngine />
      <CatalogHydrator /> {/* <-- Injected into the app shell */}

      {/* Visual UI Layer */}
      <POSHeader cashierName={cashierName} />

      <main className="flex-1 flex flex-col md:flex-row w-full h-[calc(100dvh-4rem)] overflow-hidden">
        {children}
      </main>

    </motion.div>
  );
}