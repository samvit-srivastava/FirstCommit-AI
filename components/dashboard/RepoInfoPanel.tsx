"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Star, GitBranch, Clock, Code2, User, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary } from "@/types";
import { soundManager } from "@/lib/sounds";

interface RepoInfoPanelProps {
  summary: ProjectSummary;
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
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
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.02] last:border-0">
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground/35 font-sans shrink-0">
        <Icon className="h-4 w-4 opacity-80" />
        <span className="uppercase tracking-widest font-black text-[9px]">{label}</span>
      </div>
      <div className="text-xs font-mono font-bold text-foreground text-right truncate">{value}</div>
    </div>
  );
}

function getOwner(url: string): string {
  if (!url) return "—";
  const parts = url.split("/");
  return parts[3] || "—";
}

export function RepoInfoPanel({ summary }: RepoInfoPanelProps) {
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="h-full"
    >
      <Card className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl rounded-2xl relative overflow-hidden h-full select-none flex flex-col justify-between">
        {/* Subtle top glow line with warmer combination accents */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent" />

        <div>
          <CardHeader className="p-6 pb-4 border-b border-white/5">
            <CardTitle className="text-[10px] font-heading font-black uppercase tracking-widest text-foreground/95 flex items-center gap-2.5">
              <Globe className="h-4.5 w-4.5 text-[#8B5CF6]" />
              Repository Information
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-0">
            {/* Repo Name & Description */}
            <div className="mb-5">
              <p className="text-base font-heading font-black text-foreground tracking-tight leading-snug">
                {summary.name}
              </p>
              {summary.description && (
                <p className="mt-2 text-xs text-muted-foreground/50 leading-relaxed font-sans line-clamp-3 font-medium">
                  {summary.description}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-white/5 mb-4" />

            {/* Info Rows — real data only */}
            <div className="space-y-0.5">
              <InfoRow
                icon={User}
                label="Owner"
                value={<span className="text-foreground font-bold">{getOwner(summary.url)}</span>}
              />
              <InfoRow
                icon={GitBranch}
                label="Branch"
                value={<span className="text-foreground font-bold">{summary.default_branch || "main"}</span>}
              />
              <InfoRow
                icon={Star}
                label="Stars"
                value={
                  <span className="text-foreground font-bold">
                    {summary.stars >= 1000
                      ? `${(summary.stars / 1000).toFixed(1)}k`
                      : summary.stars}
                  </span>
                }
              />
              {summary.forks !== undefined && summary.forks > 0 && (
                <InfoRow
                  icon={GitBranch}
                  label="Forks"
                  value={<span className="text-foreground font-bold">{summary.forks}</span>}
                />
              )}
              {summary.watchers !== undefined && summary.watchers > 0 && (
                <InfoRow
                  icon={Globe}
                  label="Watchers"
                  value={<span className="text-foreground font-bold">{summary.watchers}</span>}
                />
              )}
              <InfoRow
                icon={Code2}
                label="Language"
                value={
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono font-bold bg-white/[0.04] border border-white/10 backdrop-blur-sm shadow-sm select-none">
                    <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] bg-clip-text text-transparent font-black">
                      {summary.language || "TypeScript"}
                    </span>
                  </div>
                }
              />
              <InfoRow
                icon={Clock}
                label="Updated"
                value={
                  <span className="text-foreground font-bold">
                    {summary.updated_at ? new Date(summary.updated_at).toLocaleDateString() : "Just now"}
                  </span>
                }
              />
            </div>
          </CardContent>
        </div>

        {/* GitHub Link Button section */}
        <div className="p-6 pt-0">
          {/* Divider */}
          <div className="h-[1px] bg-white/5 mb-5" />

          <motion.a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playClick()}
            onMouseEnter={() => {
              setBtnHovered(true);
              soundManager.playHover();
            }}
            onMouseLeave={() => setBtnHovered(false)}
            whileHover={{ 
              scale: 1.02, 
              y: -2,
              borderColor: "rgba(139, 92, 246, 0.4)",
              boxShadow: "0 8px 24px -6px rgba(139, 92, 246, 0.25)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-xs text-foreground transition-colors duration-200 cursor-pointer w-full group relative overflow-hidden"
          >
            {/* Ambient hover glow inside button */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/10 to-[#00D4FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-center gap-2.5 z-10">
              <motion.div
                animate={{
                  rotate: btnHovered ? [0, -10, 10, 0] : 0,
                  scale: btnHovered ? 1.1 : 1
                }}
                transition={{ duration: 0.4 }}
              >
                <GitHubIcon className="h-4.5 w-4.5 text-foreground/80 group-hover:text-foreground" />
              </motion.div>
              <span className="font-heading font-black uppercase tracking-wider text-[10px]">View on GitHub</span>
            </div>

            <motion.div
              animate={{ 
                x: btnHovered ? 3 : 0, 
                y: btnHovered ? -3 : 0 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="z-10"
            >
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.div>
          </motion.a>
        </div>
      </Card>
    </motion.div>
  );
}
