"use client";

import { motion } from "framer-motion";
import { CheckCircle2, GitCommit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/types";
import { soundManager } from "@/lib/sounds";
import { useState } from "react";

interface RecentActivityProps {
  activities: ActivityItem[];
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="flex items-start gap-5 relative group"
      onMouseEnter={() => {
        setHovered(true);
        soundManager.playHover();
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node element perfectly aligned on the line */}
      <motion.div 
        animate={{
          borderColor: hovered ? "rgba(124, 92, 255, 0.5)" : "rgba(255, 255, 255, 0.1)",
          boxShadow: hovered 
            ? "0 0 15px rgba(124, 92, 255, 0.4), inset 0 0 8px rgba(124, 92, 255, 0.2)"
            : "none",
          scale: hovered ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#050816] border transition-all duration-300"
      >
        {/* Pulse Dot in the background */}
        <span className="absolute inset-0 rounded-full bg-[#00FFC6]/5 animate-ping opacity-30" />
        
        <CheckCircle2 className="h-4 w-4 text-[#00D4FF] group-hover:text-[#00FFC6] transition-colors duration-200" />
      </motion.div>

      {/* Content panel slightly expanding on hover */}
      <motion.div 
        animate={{
          x: hovered ? 3 : 0,
          scale: hovered ? 1.008 : 1,
          borderColor: hovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
          backgroundColor: hovered ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.01)",
          boxShadow: hovered 
            ? "0 10px 25px -10px rgba(0, 0, 0, 0.4)" 
            : "0 2px 4px -1px rgba(0, 0, 0, 0.05)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="min-w-0 flex-1 border p-4 rounded-xl transition-all duration-200 select-none cursor-pointer"
        onClick={() => soundManager.playClick()}
      >
        <div className="flex justify-between items-start gap-3">
          <p className="text-xs font-heading font-black uppercase tracking-wider text-foreground">
            {activity.title}
          </p>
          <span className="shrink-0 font-mono text-[9px] text-muted-foreground/30 uppercase font-bold tracking-wider">
            {activity.timestamp}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground/60 leading-relaxed font-sans font-medium">
          {activity.description}
        </p>
      </motion.div>
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl rounded-2xl relative overflow-hidden select-none">
        <CardHeader className="p-6 pb-4 border-b border-white/5">
          <CardTitle className="text-[10px] font-heading font-black uppercase tracking-widest text-foreground/95 flex items-center gap-2.5">
            <GitCommit className="h-4.5 w-4.5 text-[#00FFC6] animate-pulse" />
            AI Execution Log
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 relative">
          {/* Centered vertical gradient connection line relative to 24px padding + 16px center */}
          <div className="absolute left-[40px] top-8 bottom-8 w-[1.5px] bg-gradient-to-b from-[#7C5CFF]/70 via-[#00D4FF]/40 to-transparent opacity-30" />

          <div className="space-y-6">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
