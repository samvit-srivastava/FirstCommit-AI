"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/types";
import { soundManager } from "@/lib/sounds";

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="glass border-border/40 relative overflow-hidden">
        {/* Glow corner overlay */}
        <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />

        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="text-base font-heading font-bold uppercase tracking-wider text-foreground">
            System Operations Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative">
          
          {/* Vertical Timeline connection line */}
          <div className="absolute left-[31px] top-6 bottom-6 w-[1.5px] bg-border/40" />

          <div className="space-y-6">
            {activities.map((activity) => (
              <motion.div 
                key={activity.id} 
                className="flex items-start gap-4 group relative"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => soundManager.playHover()}
              >
                {/* Glowing check node */}
                <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 border border-secondary/35 group-hover:bg-[#00FFC6]/20 group-hover:border-[#00FFC6]/60 transition-all duration-300">
                  {/* Pulse Dot */}
                  <span className="absolute -inset-0.5 rounded-full bg-[#00FFC6]/10 animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
                  <CheckCircle2 className="h-4 w-4 text-[#00D4FF] group-hover:text-[#00FFC6] transition-colors" />
                </div>

                <div className="min-w-0 flex-1 bg-secondary/5 border border-border/20 p-3 rounded-xl hover:bg-secondary/10 hover:border-border/40 transition-all duration-200">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-heading font-semibold text-foreground">
                      {activity.title}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground/80 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
