"use client";

import { GitBranch } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { soundManager } from "@/lib/sounds";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 px-6 py-8 bg-[#050816]/10 backdrop-blur-md overflow-hidden font-sans select-none">
      
      {/* Subtle top border line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,transparent,#7C5CFF,#00FFC6,transparent)] opacity-40" />

      <div className="mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground/60">
        
        {/* Left Side: Logo & Description */}
        <div 
          className="flex flex-col items-center md:items-start gap-1 cursor-pointer"
          onMouseEnter={() => soundManager.playHover()}
        >
          <div className="flex items-center gap-2 text-sm font-heading font-black uppercase tracking-wider text-foreground">
            <GitBranch className="h-4 w-4 text-[#00FFC6]" />
            <span>{APP_NAME}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 text-center md:text-left leading-relaxed max-w-xs font-sans">
            Synthesizing codebase structures, folder layouts, and interactive quest timelines.
          </p>
        </div>

        {/* Center: Copyright & Hackathon */}
        <div className="text-center text-[11px] font-mono">
          &copy; {new Date().getFullYear()} {APP_NAME} &bull; Built for <span className="text-foreground font-semibold">United Hacks V7</span>
        </div>

        {/* Right Side: Attribution */}
        <div className="text-[10px] font-mono uppercase tracking-wider text-center md:text-right text-muted-foreground/40">
          Powered by Gemini + AI Repository Intelligence
        </div>

      </div>
    </footer>
  );
}
