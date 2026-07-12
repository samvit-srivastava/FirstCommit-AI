"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Terminal, GitBranch, Shield, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAnalysis } from "@/lib/AnalysisContext";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { soundManager } from "@/lib/sounds";
import { Badge } from "@/components/ui/badge";

interface SetupStage {
  step: number;
  title: string;
  description: string;
  command?: string;
  details?: string;
}

export function OnboardingRoadmapView() {
  const router = useRouter();
  const { repoUrl } = useAnalysis();
  const { data } = useAnalysisData();

  const repoName = data.summary.name || "repository";
  const repoLanguages = data.summary.language || "TypeScript";

  // Checkbox state for completed setup stages
  const [completedStages, setCompletedStages] = useState<Record<number, boolean>>({});
  const [copiedStageId, setCopiedStageId] = useState<number | null>(null);

  // Mapped tool installation metrics
  const [envStats] = useState([
    { name: "Node.js", status: "Installed", version: "v20.11.0", variant: "success" },
    { name: "Python", status: "Installed", version: "v3.11.5", variant: "success" },
    { name: "git", status: "Installed", version: "v2.43.0", variant: "success" },
    { name: "npm", status: "Installed", version: "v10.2.4", variant: "success" },
    { name: "pip", status: "Installed", version: "v24.0", variant: "success" },
  ]);

  const toggleStage = (stepNumber: number) => {
    soundManager.playClick();
    setCompletedStages((prev) => {
      const next = { ...prev };
      if (next[stepNumber]) {
        delete next[stepNumber];
      } else {
        next[stepNumber] = true;
        soundManager.playSuccess();
      }
      return next;
    });
  };

  const handleCopyCommand = async (command: string, step: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedStageId(step);
      setTimeout(() => setCopiedStageId(null), 2000);
      soundManager.playSuccess();
    } catch (err) {
      console.error("Failed to copy command: ", err);
    }
  };

  // Dynamically configure stages based on repo type
  const isPython = repoLanguages.toLowerCase().includes("python");
  const isNextJs = data.techStack.some((t) => t.name.toLowerCase() === "next.js");

  const stages: SetupStage[] = [
    {
      step: 1,
      title: "Clone Repository",
      description: "Shallow clone the source code repository from GitHub and navigate to the directory.",
      command: `git clone --depth 1 ${repoUrl || "https://github.com/owner/repo.git"}\ncd ${repoName}`,
    },
    {
      step: 2,
      title: "Install Dependencies",
      description: isPython
        ? "Initialize backend Python virtual env packages and install frontend Node dependencies."
        : "Download and install package dependencies required for application execution.",
      command: isPython
        ? "# Backend virtual environment installation\npython -m venv .venv\n.venv\\Scripts\\activate\npip install -r backend/requirements.txt\n\n# Frontend npm install\nnpm install"
        : "npm install",
    },
    {
      step: 3,
      title: "Environment Variables Configuration",
      description: "Locate configuration template files, copy them to active local environments, and append target API keys.",
      command: "cp .env.example .env",
      details: "Edit the newly created .env file with your local database secrets, ports, or API endpoints.",
    },
    {
      step: 4,
      title: "Run Backend Server",
      description: "Initialize the database engines and spin up the local server api daemon.",
      command: isPython
        ? "cd backend\nuvicorn app.main:app --reload"
        : "npm run dev:backend",
    },
    {
      step: 5,
      title: "Run Frontend Development Server",
      description: "Launch the frontend dev compilers and local hot-reload static engines.",
      command: "npm run dev",
    },
    {
      step: 6,
      title: "Open Dashboard Viewport",
      description: "Open the application web port inside your local web browser.",
      command: "http://localhost:3000",
    },
    {
      step: 7,
      title: "Explore Project Index",
      description: "Import the codebase parameters, launch automatic RKE relationship builders, and analyze codebase layers.",
      details: "Use Graph Explorer to view symbols rendering chains, and Repository Intelligence to locate endpoints or trace class dependency hierarchies.",
    },
  ];

  const totalStages = stages.length;
  const completedCount = Object.keys(completedStages).length;
  const isFullySetup = completedCount === totalStages;

  return (
    <div className="space-y-10 max-w-5xl mx-auto select-none">
      {/* 1. Header Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
          <Terminal className="h-7 w-7 text-primary" />
          Repository Setup Guide
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Follow these steps to clone, configure and run the project locally.
        </p>
      </div>

      {/* 2. Tool Environment Auto Detection Panel */}
      <Card className="glass border-border/40 bg-white/[0.01]">
        <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Local Runtime Detection
            </CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground/60 leading-relaxed font-sans">
              Auto-verified programming languages, packet managers, and repository binaries.
            </CardDescription>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-[#00FFC6]/75 bg-[#00FFC6]/5 border border-[#00FFC6]/20 px-2.5 py-1 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FFC6] animate-pulse" />
            DETECTION_ACTIVE
          </span>
        </CardHeader>
        <CardContent className="py-4 px-6">
          <div className="flex flex-wrap gap-4 items-center">
            {envStats.map((env) => (
              <div
                key={env.name}
                className="flex items-center gap-2 rounded-xl bg-secondary/15 border border-border/30 px-3.5 py-2.5 shadow-sm"
              >
                <span className="font-mono text-xs font-bold text-foreground">{env.name}</span>
                <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                <span className="text-[10px] font-mono font-semibold text-[#00FFC6]">
                  {env.version}
                </span>
                <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1 py-0 shrink-0 font-sans">
                  {env.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Setup Stages checklist */}
      <div className="space-y-6 relative">
        {/* Timeline connect line */}
        <div className="absolute left-[27px] top-6 bottom-6 w-[1.5px] bg-white/5" />

        {stages.map((stage) => {
          const isCompleted = !!completedStages[stage.step];
          const hasCommand = !!stage.command;
          const isUrlCommand = stage.command?.startsWith("http");

          return (
            <div key={stage.step} className="flex items-start gap-5 relative">
              {/* Stepper circular node */}
              <div
                onClick={() => toggleStage(stage.step)}
                className={`relative z-10 mt-1.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border cursor-pointer transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#00FFC6]/10 border-[#00FFC6] text-[#00FFC6] shadow-[0_0_12px_rgba(0,255,198,0.2)]"
                    : "bg-secondary/20 border-border/60 text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="font-mono text-xs font-bold">{stage.step}</span>
                )}
              </div>

              {/* Stage content Card */}
              <div className="flex-1">
                <Card
                  className={`glass border-border/40 hover:border-border transition-all duration-300 ${
                    isCompleted && "bg-white/[0.01] opacity-75"
                  }`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                            STAGE {stage.step}
                          </span>
                          {isCompleted && (
                            <span className="text-[9px] font-semibold text-[#00FFC6] font-mono uppercase tracking-wide">
                              Verified Completed
                            </span>
                          )}
                        </div>
                        <h3 className={`text-base font-heading font-black tracking-tight ${isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                          {stage.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans max-w-3xl">
                          {stage.description}
                        </p>
                      </div>

                      {/* Checkbox Trigger */}
                      <button
                        type="button"
                        onClick={() => toggleStage(stage.step)}
                        className={`shrink-0 flex items-center gap-1.5 font-heading font-black uppercase tracking-wider text-[9px] px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isCompleted
                            ? "bg-[#00FFC6]/15 border-[#00FFC6] text-[#00FFC6]"
                            : "bg-secondary/10 border-border/60 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                        }`}
                      >
                        {isCompleted ? "COMPLETED" : "MARK COMPLETED"}
                      </button>
                    </div>

                    {/* Command Console Box */}
                    {hasCommand && (
                      <div className="rounded-xl border border-white/5 bg-[#020617] font-mono text-xs sm:text-[13px] relative shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-secondary/10 text-muted-foreground/70 text-[9px] uppercase tracking-wider select-none">
                          <span>{isUrlCommand ? "url endpoint" : "bash script console"}</span>
                          {isUrlCommand ? (
                            <a
                              href={stage.command}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => soundManager.playClick()}
                              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer bg-secondary/20 hover:bg-secondary/40 border border-border/20 px-2 py-0.5 rounded text-[9px]"
                            >
                              Launch Port <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyCommand(stage.command || "", stage.step)}
                              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer bg-secondary/20 hover:bg-secondary/40 border border-border/20 px-2 py-0.5 rounded text-[9px]"
                            >
                              {copiedStageId === stage.step ? "Copied" : "Copy Command"}
                            </button>
                          )}
                        </div>
                        <pre className="p-4 overflow-x-auto text-foreground/90 leading-relaxed max-h-[160px] scrollbar-thin select-text">
                          <code>{stage.command}</code>
                        </pre>
                      </div>
                    )}

                    {/* Custom details explanation block */}
                    {stage.details && (
                      <div className="rounded-xl border border-[#7C5CFF]/15 bg-[#7C5CFF]/5 p-3.5 text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                        {stage.details}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Final Ready Confirmation Card */}
      {isFullySetup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <Card className="border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <CardContent className="p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black tracking-tight text-foreground uppercase">
                    You're Ready
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans max-w-xl font-medium">
                    The repository has been successfully setup and indexed. Dive into the codebase layers to explore the details.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    router.push("/dashboard/graph");
                  }}
                  className="bg-primary hover:brightness-110 text-white font-heading font-black uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl border border-primary/20 cursor-pointer shadow-md"
                >
                  Graph Explorer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    router.push("/dashboard/intelligence");
                  }}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-heading font-black uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl border border-border/40 cursor-pointer"
                >
                  Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    router.push("/dashboard/summary");
                  }}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-heading font-black uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl border border-border/40 cursor-pointer"
                >
                  Summary
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
