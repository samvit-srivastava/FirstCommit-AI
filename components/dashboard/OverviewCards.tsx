"use client";

import { motion } from "framer-motion";
import { Code2, FolderTree, Map, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OverviewStat } from "@/types";

const STAT_ICONS = [Code2, FolderTree, Map, Star];

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
          <motion.div key={stat.label} variants={cardVariants}>
            <Card className="glass border-border/40 transition-all duration-200 hover:glow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-foreground/80">
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
