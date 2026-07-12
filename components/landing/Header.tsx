"use client";

import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { soundManager } from "@/lib/sounds";
import { motion } from "framer-motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 h-[72px] flex items-center justify-center transition-all duration-300">
      <motion.div 
        animate={{
          scale: scrolled ? 0.98 : 1,
          y: scrolled ? 3 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-4xl flex h-14 items-center justify-between px-6 rounded-2xl border transition-all duration-300 ${
          scrolled 
            ? "bg-[#030712]/75 backdrop-blur-xl border-white/15 shadow-[0_8px_32px_-6px_rgba(0,0,0,0.5)]" 
            : "bg-[#030712]/40 backdrop-blur-md border-white/10 shadow-none"
        }`}
      >
        {/* Logo */}
        <div 
          className="flex items-center gap-2 group cursor-pointer"
          onMouseEnter={() => soundManager.playHover()}
          onClick={() => soundManager.playClick()}
        >
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:glow-sm transition-all duration-300"
          >
            <GitBranch className="h-4 w-4 text-primary" />
          </motion.div>
          <span className="text-sm font-heading font-black uppercase tracking-wider text-foreground">
            {APP_NAME}
          </span>
        </div>

        {/* Action badge (Vercel style) */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium bg-primary/15 text-primary border border-primary/20">
            v2.0.0-hackathon
          </span>
        </div>
      </motion.div>
    </header>
  );
}
