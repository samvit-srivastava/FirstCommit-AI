"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Code2, FolderTree, Map, Star } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import type { OverviewStat } from "@/types";
import { soundManager } from "@/lib/sounds";

const STAT_ICONS = [Code2, FolderTree, Map, Star];
// Premium combined gradient accent highlights
const GRADIENT_COLORS = [
  "from-[#8B5CF6] via-[#7C5CFF] to-[#00D4FF]",
  "from-[#00D4FF] via-[#00FFC6] to-[#8B5CF6]",
  "from-[#7C5CFF] via-[#8B5CF6] to-[#00FFC6]",
  "from-[#00FFC6] via-[#00D4FF] to-[#7C5CFF]"
];

function CountUp({ to }: { to: string }) {
  const numeric = parseInt(to.replace(/[^0-9]/g, ""), 10);
  const suffix = to.replace(/[0-9]/g, "");
  const [count, setCount] = useState(() => (isNaN(numeric) ? 0 : 0));

  useEffect(() => {
    if (isNaN(numeric)) return;
    let start = 0;
    const duration = 800;
    const steps = duration / 16;
    const increment = Math.ceil(numeric / steps) || 1;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numeric]);

  if (isNaN(numeric)) return <span>{to}</span>;
  return <span>{count}{suffix}</span>;
}

interface StatCardProps {
  stat: OverviewStat;
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
  const Icon = STAT_ICONS[index % STAT_ICONS.length];
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
    
    // Smooth responsive tilt
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    setTiltX((yc - y) / yc * 3.5); // Max tilt of 3.5 degrees
    setTiltY((x - xc) / xc * 3.5);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setHovered(true);
        soundManager.playHover();
      }}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: hovered ? tiltX : 0,
        rotateY: hovered ? tiltY : 0,
        y: hovered ? -6 : 0,
        scale: hovered ? 1.015 : 1,
        borderColor: hovered ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.1)",
        boxShadow: hovered 
          ? "0 15px 35px -10px rgba(139, 92, 246, 0.18), 0 0 20px -3px rgba(0, 212, 255, 0.1)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="cursor-pointer relative overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-md transition-colors duration-300 select-none"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Premium ambient glow at top left */}
      <div className="absolute top-0 left-0 h-16 w-16 bg-[#8B5CF6]/5 rounded-full blur-xl pointer-events-none" />

      {/* Dynamic Cursor Spotlight Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(139, 92, 246, 0.08), transparent 80%)`,
        }}
      />

      <CardContent className="flex items-start gap-4.5 p-6">
        <motion.div 
          animate={{
            scale: hovered ? 1.08 : 1,
            rotate: hovered ? 8 : 0,
            borderColor: hovered ? "rgba(139, 92, 246, 0.4)" : "rgba(255, 255, 255, 0.05)",
            backgroundColor: hovered ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.02)"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.01]"
        >
          <Icon className="h-5.5 w-5.5 text-foreground/80" />
        </motion.div>
        
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-mono font-black tracking-tight text-foreground">
            <CountUp to={stat.value} />
          </p>
          <p className="text-[9px] font-heading font-black uppercase tracking-widest text-[#00FFC6] mt-2 opacity-80">
            {stat.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/45 leading-relaxed font-sans font-medium">
            {stat.description}
          </p>

          {/* Premium Bottom Accent Gradient Bar - Constant Width, Soft Shimmer */}
          <div className="mt-4 h-[1px] w-full bg-white/5 relative overflow-hidden rounded-full">
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-r ${gradient}`}
              animate={{
                x: hovered ? ["-100%", "100%"] : "0%"
              }}
              transition={{
                repeat: hovered ? Infinity : 0,
                duration: 2.5,
                ease: "linear"
              }}
              style={{
                width: "200%",
                opacity: hovered ? 0.6 : 0.25
              }}
            />
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}

interface OverviewCardsProps {
  stats: OverviewStat[];
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={stat.label} className="group">
          <StatCard stat={stat} index={index} />
        </div>
      ))}
    </div>
  );
}
