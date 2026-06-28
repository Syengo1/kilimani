'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/app/(admin)/dashboard/layout';

export function MobileHeader({ userName, userRole }: { userName: string; userRole: AppRole }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-16 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 shrink-0 shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-lg font-serif font-black tracking-tight text-foreground leading-none">Kilimani.</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{userRole.replace('_', ' ')}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors active:scale-95 touch-manipulation"
          aria-label="Secure Logout"
        >
          {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} strokeWidth={2.5} />}
        </button>
      </div>
    </header>
  );
}