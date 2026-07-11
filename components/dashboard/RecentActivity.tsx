"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ActivityItem } from "@/types";

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
      <Card className="glass border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 px-6 pb-5">
          {activities.map((activity, index) => (
            <div key={activity.id}>
              {index > 0 && <Separator className="my-3 bg-border/30" />}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground/60">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
