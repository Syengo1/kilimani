// src/components/layout/Footer.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer className="w-full bg-stone-950 text-stone-400 py-12 border-t border-stone-800 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
        
        <div className="mb-6 md:mb-0">
          <h3 className="font-serif text-2xl text-white mb-2">Kilimani</h3>
          <p className="text-sm font-light text-stone-500">Premium quality hair & extensions.</p>
        </div>

        <div className="flex gap-6 text-sm mb-8 md:mb-0">
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
        </div>

      </div>

      {/* Bottom Bar & Easter Egg */}
      <div className="w-full max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-stone-800/50 flex flex-col items-center justify-center">
        <p className="text-xs text-stone-600 mb-4">
          © {new Date().getFullYear()} Kilimani Hair. All rights reserved.
        </p>
        
        <div 
          className="relative group cursor-pointer inline-flex flex-col items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* The Easter Egg Animation */}
          <div className={`absolute bottom-full mb-2 transition-all duration-500 ease-out flex items-center justify-center pointer-events-none
                          ${isHovered ? 'opacity-100 translate-y-0 scale-110' : 'opacity-0 translate-y-4 scale-50'}`}>
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
               <span className="text-xl animate-pulse inline-block">✨ 🚀 ✨</span>
            </div>
          </div>
          
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-700 transition-all duration-500 group-hover:text-amber-500">
            developed by Syengo
          </span>
        </div>
      </div>
    </footer>
  );
}