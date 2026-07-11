"use client";

import { motion } from "framer-motion";
import { ExternalLink, Star, GitBranch, Clock, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ProjectSummary } from "@/types";

interface RepoInfoPanelProps {
  summary: ProjectSummary;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function RepoInfoPanel({ summary }: RepoInfoPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="glass border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Repository Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {summary.name}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {summary.description}
            </p>
          </div>

          <Separator className="bg-border/30" />

          <div className="space-y-2.5">
            <InfoRow
              icon={Star}
              label="Stars"
              value={
                summary.stars >= 1000
                  ? `${Math.round(summary.stars / 1000)}k`
                  : summary.stars
              }
            />
            <InfoRow
              icon={Code2}
              label="Language"
              value={
                <Badge variant="secondary" className="text-xs">
                  {summary.language}
                </Badge>
              }
            />
            <InfoRow
              icon={GitBranch}
              label="Default Branch"
              value="main"
            />
            <InfoRow
              icon={Clock}
              label="Analyzed"
              value="Just now"
            />
          </div>

          <Separator className="bg-border/30" />

          <a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View on GitHub</span>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
