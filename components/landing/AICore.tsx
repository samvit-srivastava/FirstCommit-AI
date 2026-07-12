"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Cpu } from "lucide-react";
import { soundManager } from "@/lib/sounds";

export function AICore() {
  const coreRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useSpring(mouseX, springConfig));
  const rotateY = useSpring(useSpring(mouseY, springConfig));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!coreRef.current) return;
    const rect = coreRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    mouseX.set(-y / 12);
    mouseY.set(x / 12);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    soundManager.playHover();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="relative flex items-center justify-center p-8 select-none">

      {/* 
        Subtle Hardware-Accelerated Ambient SVG Radar:
        - Centered directly behind the AI Core.
        - 4 ultra-thin concentric rings (0.35px stroke width).
        - Extremely slow 110s linear GPU rotation curve.
        - Faint but visible opacity (3.8%) makes it visible on careful inspection.
      */}
      <div 
        className="absolute inset-[-100px] flex items-center justify-center pointer-events-none select-none z-[-20] opacity-[0.038]"
        style={{
          transformOrigin: "center",
          animation: "slow-rotate 110s linear infinite",
          willChange: "transform",
        }}
      >
        <svg viewBox="0 0 1000 1000" className="w-[180%] h-[180%] max-w-[650px] max-h-[650px]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="500" cy="500" r="140" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="0.35" />
          <circle cx="500" cy="500" r="280" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="0.35" />
          <circle cx="500" cy="500" r="420" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="0.35" />
          <circle cx="500" cy="500" r="560" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="0.35" />
        </svg>
      </div>

      {/* Interactive 3D Core */}
      <motion.div
        ref={coreRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative flex h-80 w-80 items-center justify-center cursor-pointer"
      >
        {/* Breathing backdrop glow */}
        <motion.div 
          animate={{
            scale: hovered ? [1.1, 1.25, 1.1] : [1, 1.15, 1],
            opacity: hovered ? 0.9 : 0.6,
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.08)_0%,transparent_65%)] blur-[45px] pointer-events-none"
        />

        {/* Outer Orbit Ring 1 (Dashed) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute h-72 w-72 rounded-full border border-primary/20 border-dashed flex items-center justify-center"
        >
          {/* Floating tech symbol node - TS */}
          <div className="absolute -top-3 h-6 w-6 rounded-lg bg-[#050816] border border-primary/40 flex items-center justify-center font-mono text-[8px] font-bold text-primary animate-pulse">
            TS
          </div>
          {/* Floating tech symbol node - React */}
          <div className="absolute -bottom-3 h-6 w-6 rounded-lg bg-[#050816] border border-primary/40 flex items-center justify-center font-mono text-[8px] font-bold text-primary">
            JSX
          </div>
        </motion.div>

        {/* Orbit Ring 2 (Tilted Cyber Cyan) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute h-56 w-56 rounded-full border border-secondary/30 border-dotted"
        >
          {/* Rotating satellite node */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 -right-1 h-2 w-2 rounded-full bg-[#00D4FF] glow-sm" 
          />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-[#050816] border border-secondary/40 flex items-center justify-center font-mono text-[8px] font-bold text-secondary">
            AI
          </div>
        </motion.div>

        {/* Orbit Ring 3 (Dot Matrix) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute h-40 w-40 rounded-full border border-[#00FFC6]/20 border-dashed"
        >
          <motion.div className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#00FFC6] glow-accent" />
        </motion.div>

        {/* Central Core Sphere with breathing glow */}
        <motion.div
          animate={{
            scale: hovered ? 1.08 : 1,
            boxShadow: hovered 
              ? "0 0 50px rgba(124, 92, 255, 0.55), 0 0 100px rgba(0, 255, 198, 0.3)"
              : "0 0 30px rgba(124, 92, 255, 0.25), 0 0 60px rgba(0, 212, 255, 0.15)"
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,92,255,0.8)_0%,rgba(3,7,18,0.98)_75%)] border border-primary/60"
        >
          {/* Pulsing energy center */}
          <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,198,0.3)_0%,transparent_60%)] animate-pulse duration-[2500ms]" />

          {/* Core HUD Details */}
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-1 z-10"
          >
            <Cpu className="h-8 w-8 text-[#00FFC6]" />
            <span className="font-heading text-[10px] font-black uppercase tracking-widest text-foreground">
              CORE_OS
            </span>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}
