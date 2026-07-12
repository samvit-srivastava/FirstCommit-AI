"use client";

import {
  Menu,
  Search,
  ExternalLink,
  Star,
  ChevronDown,
} from "lucide-react";
import { useAnalysis } from "@/lib/AnalysisContext";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { analysisResult, repoUrl } = useAnalysis();

  if (!analysisResult) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-card/30 px-4 backdrop-blur-sm sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">FirstCommit AI</span>
        </div>
        <div className="flex-1" />
      </header>
    );
  }

  const repo = {
    name: analysisResult.repository_name,
    url: repoUrl || `https://github.com/${analysisResult.repository_name}`,
    stars: 0,
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-card/30 px-4 backdrop-blur-sm sm:gap-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Repository selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary">
          <span className="font-semibold text-foreground">{repo.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
          aria-label="Open repository on GitHub"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <Badge
          variant="secondary"
          className="hidden items-center gap-1 text-xs sm:flex"
        >
          <Star className="h-3 w-3" />
          {repo.stars >= 1000
            ? `${Math.round(repo.stars / 1000)}k`
            : repo.stars}
        </Badge>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden items-center gap-2 rounded-lg border border-border/40 bg-secondary/50 px-3 py-1.5 sm:flex">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search repository…"
          className="w-32 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none lg:w-48"
          aria-label="Search repository"
        />
        <kbd className="hidden rounded border border-border/60 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-block">
          ⌘K
        </kbd>
      </div>



      {/* User avatar placeholder */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        aria-label="User avatar"
        role="img"
      >
        KS
      </div>
    </header>
  );
}
