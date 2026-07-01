'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border/40 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="font-serif text-3xl font-bold text-foreground tracking-tight mb-4">
              Kilimani
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[250px] mb-6">
              Premium quality hair, extensions, and styling accessories for the modern aesthetic.
            </p>
            
            {/* Social Media Row */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/kilimanihair?igsh=MTRpdXZ6aXcxNmt2Mw%3D%3D" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-foreground/[0.03] hover:bg-foreground/10 text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-foreground/[0.03] hover:bg-foreground/10 text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-foreground/[0.03] hover:bg-foreground/10 text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-full transition-all active:scale-95" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-5">Shop</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/shop/featured" className="text-muted-foreground hover:text-foreground transition-colors">Featured</Link>
              <Link href="/shop/wigs" className="text-muted-foreground hover:text-foreground transition-colors">Premium Wigs</Link>
              <Link href="/shop/bundles" className="text-muted-foreground hover:text-foreground transition-colors">Bundles</Link>
              <Link href="/shop/accessories" className="text-muted-foreground hover:text-foreground transition-colors">Accessories</Link>
            </div>
          </div>

          {/* Support Column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-5">Support</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping & Delivery</Link>
              <Link href="/returns" className="text-muted-foreground hover:text-foreground transition-colors">Returns & Exchanges</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Legal Column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-5">Legal</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR: Copyright & Kinetic Easter Egg */}
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <p className="text-xs font-medium text-muted-foreground">
            © {currentYear} Kilimani Hair. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <span className="tracking-wide">Engineered by</span>
            <motion.a
              href="https://antonysyengo.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center pr-5 pl-1 py-1 overflow-visible"
              initial="rest"
              whileHover="hover"
              animate="rest"
            >
              {/* Kinetic Text Glitch/Glow Effect */}
              <motion.span
                variants={{
                  rest: { 
                    color: "currentColor", 
                    letterSpacing: "0em", 
                    textShadow: "none" 
                  },
                  hover: { 
                    color: "#d4af37", // Luxury Gold Aesthetic
                    letterSpacing: "0.1em",
                    textShadow: "0px 0px 12px rgba(212, 175, 55, 0.6)"
                  }
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative z-10 font-bold uppercase tracking-wider transition-colors"
              >
                Syengo
              </motion.span>

              {/* Emerging Icons on Hover */}
              <motion.span
                variants={{
                  rest: { opacity: 0, scale: 0.5, x: -10, rotate: -45 },
                  hover: { opacity: 1, scale: 1, x: 0, rotate: 0 }
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className="absolute right-0 text-primary"
              >
                <Code2 className="h-4 w-4" />
              </motion.span>
              
              {/* Subtle click prompt that slides up */}
              <motion.span
                variants={{
                  rest: { opacity: 0, y: 10 },
                  hover: { opacity: 1, y: -20 }
                }}
                className="absolute top-0 right-0 flex items-center text-[9px] font-mono text-primary/80 whitespace-nowrap pointer-events-none"
              >
                Execute <ArrowUpRight className="h-2 w-2 ml-0.5" />
              </motion.span>

            </motion.a>
          </div>

        </div>
      </div>
    </footer>
  );
}