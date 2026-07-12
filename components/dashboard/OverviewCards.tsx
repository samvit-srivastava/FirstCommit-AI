"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Code2, FolderTree, Map, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OverviewStat } from "@/types";
import { soundManager } from "@/lib/sounds";

const STAT_ICONS = [Code2, FolderTree, Map, Star];

function CountUp({ to }: { to: string }) {
  const numeric = parseInt(to.replace(/[^0-9]/g, ""), 10);
  const suffix = to.replace(/[0-9]/g, "");
  const [count, setCount] = useState(() => (isNaN(numeric) ? 0 : 0));

  useEffect(() => {
    if (isNaN(numeric)) return;
    let start = 0;
    const duration = 1000;
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

interface OverviewCardsProps {
  stats: OverviewStat[];
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat, index) => {
        const Icon = STAT_ICONS[index % STAT_ICONS.length];
        return (
          <motion.div 
            key={stat.label} 
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => soundManager.playHover()}
            className="cursor-pointer"
          >
            <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 hover:glow shadow-lg group">
              {/* Corner Sci-fi Indicator */}
              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />

              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  <Icon className="h-5 w-5 text-primary group-hover:text-[#00D4FF] transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-mono font-bold tracking-tight text-foreground">
                    <CountUp to={stat.value} />
                  </p>
                  <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#00FFC6]/80 mt-1">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
