// src/components/home/HeroSection.tsx
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  
  const yImage = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // FIX: Explicitly typing as 'Variants' resolves the TypeScript easing error
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }, 
    },
  };

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[100dvh] min-h-[600px] flex items-center justify-center overflow-hidden bg-stone-950"
    >
      {/* Parallax Background Image */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: yImage }}
      >
        <Image
          src="/images/hero.jpg"
          alt="Premium Kilimani Luxury Hair"
          fill
          priority
          className="object-cover opacity-90 mix-blend-overlay scale-105"
        />
        {/* FIX: Significantly lightened the overlays. 
          This only adds a soft shadow behind the text and at the bottom for the scroll arrow, 
          leaving the center/right side of your image completely unobstructed. 
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 md:from-black/50 via-black/20 to-transparent" />
      </motion.div>

      {/* Animated Hero Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ opacity: opacityText }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center md:items-start text-center md:text-left mt-16"
      >
        <motion.span 
          variants={itemVariants}
          className="text-amber-500 font-medium tracking-[0.25em] uppercase mb-4 text-xs md:text-sm shadow-sm"
        >
          Kilimani Hair Exclusives
        </motion.span>
        
        <motion.h1 
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-white leading-[1.05] mb-6 max-w-4xl drop-shadow-2xl"
        >
          Unveil Your True <br className="hidden sm:block" />
          <span className="italic text-amber-200/90 font-light pr-4">Elegance</span>
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-stone-100 text-base sm:text-lg md:text-xl mb-10 max-w-xl font-light leading-relaxed px-4 md:px-0 drop-shadow-md"
        >
          Discover our premium collection of 100% virgin human hair wigs and bundles. Expertly crafted for longevity, seamlessly designed for you.
        </motion.p>
        
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 md:px-0"
        >
          <Link
            href="/collections"
            className="group relative px-10 py-4 bg-amber-600 text-white text-sm tracking-wider uppercase font-semibold rounded-sm overflow-hidden shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] text-center block"
          >
            <span className="relative z-10 transition-transform duration-500 group-hover:scale-105 inline-block">
              Shop the Collection
            </span>
            <div className="absolute inset-0 bg-amber-500 transform scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
          </Link>
          
          <Link
            href="/about"
            className="px-10 py-4 bg-transparent border border-white/30 hover:border-white text-white text-sm tracking-wider uppercase font-semibold rounded-sm transition-all duration-500 text-center backdrop-blur-sm"
          >
            Our Heritage
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated Scroll Indicator */}
      <motion.button
        onClick={scrollToNextSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 md:bottom-12 z-20 text-stone-300 hover:text-amber-400 transition-colors duration-300 cursor-pointer focus:outline-none flex flex-col items-center gap-2 group"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown size={28} strokeWidth={1.5} />
        </motion.div>
      </motion.button>
    </section>
  );
}