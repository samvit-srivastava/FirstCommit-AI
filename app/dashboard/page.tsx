"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Award, Zap } from "lucide-react";
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
      
      {/* 1. Tactical Welcome Header HUD */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass border-primary/20 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 left-0 h-[2px] w-full bg-[linear-gradient(90deg,transparent,#7C5CFF,#00D4FF,transparent)]" />
        
        {/* User profile telemetry */}
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 rounded-xl border border-[#00FFC6]/40 bg-card/60 flex items-center justify-center overflow-hidden glow-sm group-hover:glow">
            <Cpu className="h-8 w-8 text-[#00FFC6] animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
              Welcome back, Commander
              <span className="text-primary font-bold">Krishna Singh</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Active indexing: <span className="text-[#00D4FF] font-mono">{data.summary.name}</span>
            </p>
          </div>
        </div>

        {/* XP level & badges */}
        <div className="flex flex-col w-full md:w-64 gap-2 font-mono text-xs border-t border-border/40 md:border-t-0 pt-4 md:pt-0">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1"><Award className="h-3.5 w-3.5 text-primary" /> LEVEL 4 ONBOARDER</span>
            <span className="text-primary font-bold">2560 / 3000 XP</span>
          </div>
          <div className="h-2 w-full bg-secondary/15 rounded-full overflow-hidden border border-border/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-[linear-gradient(90deg,#7C5CFF,#00D4FF)]"
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Tactical Circular HUD Gauges */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Gauge 1: Security Risk */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass border-border/40 p-5 rounded-2xl relative overflow-hidden flex items-center gap-5 group"
        >
          {/* Circular progress SVG */}
          <div className="relative h-20 w-20 shrink-0">
            <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
              <path className="text-secondary/10" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: "98, 100" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-[#00FFC6]" 
                strokeDasharray="98, 100" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="none" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-[#00FFC6]">98%</div>
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#00FFC6]" /> Security Score</h3>
            <p className="text-xs text-muted-foreground mt-1">Outstanding posture. No critical exposure vectors found.</p>
          </div>
        </motion.div>

        {/* Gauge 2: Codebase Health */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass border-border/40 p-5 rounded-2xl relative overflow-hidden flex items-center gap-5 group"
        >
          <div className="relative h-20 w-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-secondary/10" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: "96, 100" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-[#00D4FF]" 
                strokeDasharray="96, 100" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="none" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-[#00D4FF]">96%</div>
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#00D4FF]" /> Codebase Health</h3>
            <p className="text-xs text-muted-foreground mt-1">Excellent index rating. Code duplication & complexity is low.</p>
          </div>
        </motion.div>

        {/* Gauge 3: AI Confidence */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass border-border/40 p-5 rounded-2xl relative overflow-hidden flex items-center gap-5 group"
        >
          <div className="relative h-20 w-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-secondary/10" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: "94, 100" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-primary" 
                strokeDasharray="94, 100" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="none" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-primary">94%</div>
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"><Cpu className="h-4 w-4 text-primary" /> AI indexing level</h3>
            <p className="text-xs text-muted-foreground mt-1">Precise dependency context mapped. Ready for diagnostic chat.</p>
          </div>
        </motion.div>
      </div>

      {/* 3. Core Stats */}
      <OverviewCards stats={overviewStats} />

      {/* 4. Details Split layout */}
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
