"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch } from "lucide-react";
import { AICore } from "./AICore";
import { UrlInput } from "./UrlInput";
import { soundManager } from "@/lib/sounds";

const WORDS = ["Understand", "Explore", "Master", "Contribute"];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex flex-col items-center px-4 pt-20 sm:pt-24 md:pt-28 pb-0 max-w-6xl mx-auto overflow-hidden">
      
      {/* Cinematic Staggered Entrance Layout */}
      <div className="grid gap-12 md:grid-cols-12 items-center w-full relative z-10">
        
        {/* Left Side: Text Content */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          
          {/* Subtle logo pill with pulse status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm shadow-sm"
          >
            <GitBranch className="h-3.5 w-3.5 text-[#00FFC6]" />
            <span>AI OS: ACTIVE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FFC6] animate-pulse" />
          </motion.div>

          {/* Main Title heading with flipper text */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full text-4xl font-heading font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl flex flex-col"
          >
            <span className="h-16 sm:h-20 md:h-24 overflow-hidden relative flex justify-center md:justify-start items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={WORDS[wordIndex]}
                  initial={{ y: 25, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -25, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute gradient-text font-black text-glow"
                >
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-foreground mt-2">Any Repository in Minutes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground/80 font-sans"
          >
            Paste a public GitHub URL to power on the indexing engine. Get a dynamic knowledge graph summary, technology breakdown, folder hierarchy parser, and interactive codebase diagnostic chat.
          </motion.p>

          <div className="w-full pt-2">
            <UrlInput />
          </div>
        </div>

        {/* Right Side: Centered breathing AI Core */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          className="md:col-span-5 flex justify-center w-full"
        >
          <AICore />
        </motion.div>
      </div>

    </section>
  );
}
