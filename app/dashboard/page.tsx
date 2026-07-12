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

export default function DashboardPage() {
  const { data, hasRealData } = useAnalysisData();

  useEffect(() => {
    soundManager.playSuccess();
  }, []);

  // Dynamically derive overview stats from the current data
  const overviewStats = [
    {
      label: "Technologies",
      value: String(data.techStack.length),
      description: "Frameworks, languages, and build tools identified",
    },
    {
      label: "Folders Mapped",
      value: String(data.folders.length),
      description: "Top-level directories analyzed",
    },
    {
      label: "Roadmap Steps",
      value: String(data.roadmap.frontend.length),
      description: "Personalized learning steps created",
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
    <div className="mx-auto max-w-7xl space-y-8 select-none">
      
      {/* 1. Cinematic Staggered Compact Hero Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="absolute top-0 left-0 h-[1px] w-full bg-[linear-gradient(90deg,transparent,#7C5CFF,#00D4FF,transparent)] opacity-40" />
        
        <div>
          <h1 className="text-xl font-heading font-black tracking-tight text-foreground sm:text-2xl">
            Repository Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1 leading-relaxed font-medium">
            Analyze, understand and navigate your codebase with AI.
          </p>
        </div>

        {/* Telemetry Capsule bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground/40 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">REPOSITORY:</span>
            <span className="text-foreground font-bold">{data.summary.name}</span>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">LANGUAGE:</span>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold bg-white/[0.04] border border-white/10 backdrop-blur-sm shadow-sm select-none">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] bg-clip-text text-transparent font-black">
                {data.summary.language || "TypeScript"}
              </span>
            </div>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[8px] font-mono font-bold bg-[#00FFC6]/10 text-[#00FFC6] border border-[#00FFC6]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FFC6] animate-pulse" />
              AI COMPLETE
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Core Stats */}
      <OverviewCards stats={overviewStats} />

      {/* 3. Details Split layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentActivity activities={recentActivity} />
          <QuickActions />
        </div>
        <div>
          <RepoInfoPanel summary={data.summary} />
        </div>
      </div>
    </div>
  );
}
