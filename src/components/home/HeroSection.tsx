'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-start overflow-hidden pt-8 md:pt-12 pb-16 md:pb-24">
      
      {/* 1. The Physical Store Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/images/store.png" // Replace with your actual high-res store interior
          alt="Boutique interior"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* 2. The "Opal" Frosted Glass Overlay */}
      {/* bg-background/85 dynamically adapts to light/dark mode, heavily blurring the image beneath it */}
      <div className="absolute inset-0 bg-background/10 backdrop-blur-lg z-0" />

      {/* 3. Decorative Architectural Depth Rings (These now blend beautifully with the store lights) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/4 z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 translate-y-1/4 z-0" />

      {/* Main Content Grid */}
      <div className="max-w-[1600px] mx-auto w-full px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Column: Typographic Core (Columns 1-6) */}
        <div className="lg:col-span-6 flex flex-col items-start space-y-6 md:space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
          
          {/* Location Micro-Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/40 backdrop-blur-md shadow-sm">
            
            {/* Live Status Beacon */}
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </div>
            
            <MapPin size={12} className="text-primary -ml-0.5" />
            
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/80">
              Shop NO:53 4<sup className="lowercase">th</sup> Fl Lois Plaza, Nairobi CBD
            </span>
          </div>

          {/* Statement Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-serif font-black tracking-tight text-foreground leading-[1.08] drop-shadow-sm">
              Unparalleled <br />
              <span className="italic font-normal text-muted-foreground font-serif">Luster &amp; Grace</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg leading-relaxed mix-blend-normal">
              Discover masterfully sourced, premium hair selections engineered for complete natural movement, exceptional weight consistency, and enduring longevity.
            </p>
          </div>

          {/* Call To Action Suite */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto text-sm font-semibold tracking-wide mt-2">
            <Link
              href="/collections"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95 active:scale-[0.98] transition-all duration-300"
            >
              Explore Catalog
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link
              href="/about"
              className="flex items-center justify-center px-8 py-4 bg-background/50 text-foreground border border-border/50 backdrop-blur-md rounded-xl hover:bg-background/80 active:scale-[0.98] transition-all duration-300"
            >
              Our Heritage
            </Link>
          </div>

          {/* Trust Infrastructure Metrics */}
          <div className="pt-8 border-t border-border/40 w-full grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">100%</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">Virgin Human Hair</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">Premium</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">Cuticle Aligned</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">Global</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">Ethical Sourcing</p>
            </div>
          </div>

        </div>

        {/* Right Column: Asymmetric Layered Media (Columns 7-12) */}
        <div className="lg:col-span-6 relative w-full h-[450px] sm:h-[550px] lg:h-[600px] animate-in fade-in slide-in-from-right-8 duration-1000 ease-out delay-100">
          
          {/* Primary Main Image Frame */}
          <div className="absolute right-0 top-0 w-[85%] h-[90%] rounded-2xl overflow-hidden shadow-2xl bg-stone-100 dark:bg-stone-900 group border border-border/20">
            <Image
              src="https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop"
              alt="Premium luxury hair display editorial"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 mix-blend-multiply" />
          </div>

          {/* Secondary Floating Overlapping Lookbook Card */}
          <div className="absolute left-0 bottom-0 w-[45%] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-4 border-background/80 bg-stone-200 dark:bg-stone-800 transform translate-y-4 hidden sm:block group/mini">
            <Image
              src="https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?q=80&w=600&auto=format&fit=crop"
              alt="Close-up detail texture variant"
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-[2000ms] ease-out group-hover/mini:scale-105"
            />
          </div>

          {/* Geometric Accent Spacer Accent */}
          <div className="absolute right-12 bottom-4 w-12 h-12 border-r border-b border-primary/40 pointer-events-none hidden lg:block" />
          <div className="absolute right-14 bottom-6 w-3 h-3 bg-primary rounded-full pointer-events-none hidden lg:block" />

        </div>

      </div>
    </section>
  );
}