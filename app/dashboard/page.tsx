"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RepoInfoPanel } from "@/components/dashboard/RepoInfoPanel";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { mockRecentActivity } from "@/lib/mock-data";
import { soundManager } from "@/lib/sounds";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.985, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 90, damping: 14 },
  },
};

export default function DashboardPage() {
  const { data, hasRealData } = useAnalysisData();

  useEffect(() => {
    soundManager.playSuccess();
  }, []);

  // Extract owner from repository URL
  const getOwner = (url: string) => {
    if (!url) return "firstcommit";
    const parts = url.split("/");
    return parts[3] || "firstcommit";
  };

  // Dynamically derive overview stats from real data context
  const overviewStats = [
    {
      label: "Technologies",
      value: String(data.techStack.length),
      description: "Languages and frameworks identified",
    },
    {
      label: "Folders Mapped",
      value: String(data.folders.length),
      description: "Top-level directories explained",
    },
    {
      label: "Roadmap Steps",
      value: String(data.roadmap.frontend.length),
      description: "Personalized onboarding tasks",
    },
    {
      label: "GitHub Stars",
      value: data.summary.stars >= 1000
        ? `${Math.round(data.summary.stars / 1000)}k`
        : String(data.summary.stars),
      description: "Codebase popularity score",
    },
  ];

  // Dynamically configure activity items if using real backend data
  const recentActivity = hasRealData
    ? [
        {
          id: "a1",
          title: "Repository cloned",
          description: `${data.summary.name} cloned and indexed successfully`,
          timestamp: "Just now",
        },
        {
          id: "a2",
          title: "Tech stack detected",
          description: `${data.techStack.length} frameworks and languages identified`,
          timestamp: "Just now",
        },
        {
          id: "a3",
          title: "Folder structure mapped",
          description: `${data.folders.length} directories analyzed with AI explanations`,
          timestamp: "Just now",
        },
        {
          id: "a4",
          title: "Analysis complete",
          description: "Repository analysis is ready for exploration",
          timestamp: "Just now",
        },
      ]
    : mockRecentActivity;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-8 select-none font-sans"
    >
      {/* 1. Cinematic Staggered Compact Hero Panel */}
      <motion.div 
        variants={itemVariants}
        className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl px-6 py-4.5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="absolute top-0 left-0 h-[1px] w-full bg-[linear-gradient(90deg,transparent,#7C5CFF,#00D4FF,transparent)] opacity-40" />
        
        <div>
          <h1 className="text-xl font-heading font-black tracking-tight text-foreground">
            Repository Intelligence
          </h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5 leading-relaxed font-medium">
            Analyze, understand and navigate your codebase with AI.
          </p>
        </div>

        {/* Telemetry bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground/40 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">REPOSITORY:</span>
            <span className="text-foreground font-bold">{data.summary.name}</span>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">OWNER:</span>
            <span className="text-[#00D4FF] font-bold">{getOwner(data.summary.url)}</span>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">ANALYZED:</span>
            <span className="text-foreground font-bold">JUST NOW</span>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[8px] font-mono font-bold bg-[#00FFC6]/10 text-[#00FFC6] border border-[#00FFC6]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FFC6] animate-pulse" />
              AI ACTIVE
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Overview Stats (Redesigned Glass Tiles) */}
      <motion.div variants={itemVariants}>
        <OverviewCards stats={overviewStats} />
      </motion.div>

      {/* 3. Details Split layout (Timeline, Action center, Info Panel) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div variants={itemVariants}>
            <RecentActivity activities={recentActivity} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        </div>
        
        <motion.div variants={itemVariants}>
          <RepoInfoPanel summary={data.summary} />
        </motion.div>
      </div>
    </motion.div>
  );
}
