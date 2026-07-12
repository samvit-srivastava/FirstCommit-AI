"use client";

import { Menu, ExternalLink, GitBranch } from "lucide-react";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { soundManager } from "@/lib/sounds";
import { motion } from "framer-motion";

interface TopBarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { data, repoUrl, hasRealData } = useAnalysisData();

  const logoBlock = (
    <div
      className="flex items-center gap-2 text-xs font-heading font-black uppercase tracking-wider text-foreground cursor-default"
      onMouseEnter={() => soundManager.playHover()}
    >
      <GitBranch className="h-4 w-4 text-[#00FFC6]" />
      <span className="hidden sm:inline">FirstCommit</span>
    </div>
  );

  const repoDisplayUrl = hasRealData ? repoUrl : data.summary.url;

  return (
    <header className="mx-6 my-4 px-5 h-12 shrink-0 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl flex items-center justify-between z-40 relative select-none">
      {/* Mobile menu trigger */}
      <button
        onClick={onMobileMenuToggle}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Brand logo + repository selector */}
      <div className="flex items-center gap-3">
        {logoBlock}
        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          {/* Repository name capsule */}
          <span className="font-mono text-xs font-bold text-foreground bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] max-w-[180px] truncate">
            {data.summary.name}
          </span>

          {/* GitHub link */}
          <motion.a
            href={repoDisplayUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playClick()}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-white/5 hover:text-foreground flex items-center justify-center border border-transparent hover:border-white/5"
            aria-label="Open repository on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </motion.a>
        </div>
      </div>

      {/* Right: AI Ready indicator */}
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-mono font-bold bg-[#00FFC6]/10 text-[#00FFC6] border border-[#00FFC6]/20">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00FFC6] animate-pulse" />
        AI READY
      </span>
    </header>
  );
}
