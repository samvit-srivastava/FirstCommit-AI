"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCode, Check, Lock, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DEVELOPER_ROLES } from "@/lib/constants";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import type { DeveloperRole } from "@/types";
import { soundManager } from "@/lib/sounds";

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const GAME_TIERS = ["Foundation", "Core", "Intermediate", "Advanced", "Expert"];

export function OnboardingRoadmapView() {
  const { data } = useAnalysisData();
  const [activeRole, setActiveRole] = useState<DeveloperRole>("frontend");
  const [completedSteps, setCompletedSteps] = useState<Record<DeveloperRole, Record<number, boolean>>>({
    frontend: { 1: true },
    backend: {},
    fullstack: {},
    opensource: {},
  });

  const steps = data.roadmap[activeRole];
  const roleCompleted = completedSteps[activeRole] ?? {};

  const toggleStep = (stepNumber: number) => {
    soundManager.playClick();
    setCompletedSteps((prev) => {
      const activeRoleSteps = { ...prev[activeRole] };
      if (activeRoleSteps[stepNumber]) {
        delete activeRoleSteps[stepNumber];
      } else {
        activeRoleSteps[stepNumber] = true;
      }
      return {
        ...prev,
        [activeRole]: activeRoleSteps,
      };
    });
  };

  const completedCount = Object.keys(roleCompleted).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
            Contribution Roadmap
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Complete the interactive timeline quest stages to onboard onto the codebase.
          </p>
        </div>

        {/* Progress tracker HUD */}
        <div className="flex flex-col gap-1.5 w-full sm:w-48 font-mono text-xs">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground uppercase">Quest Progress</span>
            <span className="text-primary font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/15 rounded-full overflow-hidden border border-border/20">
            <motion.div
              className="h-full bg-[linear-gradient(90deg,#7C5CFF,#00FFC6)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Role filter buttons */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/40 pb-4">
        {DEVELOPER_ROLES.map((role) => {
          const isSelected = activeRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => {
                soundManager.playClick();
                setActiveRole(role.value as DeveloperRole);
              }}
              onMouseEnter={() => soundManager.playHover()}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-heading font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary/20 text-[#00FFC6] border border-primary/45 glow-sm"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interconnected Quest Timeline Map */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 relative"
      >
        {/* Continuous background connection line */}
        <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-border/40" />

        {steps.map((step, idx) => {
          const isCompleted = !!roleCompleted[step.step];
          // Previous steps must be checked to unlock the current step
          const isLocked = idx > 0 && !roleCompleted[steps[idx - 1].step];
          const tierName = GAME_TIERS[idx % GAME_TIERS.length];

          return (
            <motion.div
              key={step.step}
              variants={itemVariants}
              className={`flex items-start gap-4 relative group transition-all duration-300 ${
                isLocked ? "opacity-45" : ""
              }`}
            >
              {/* Stepper node checkpoint */}
              <div 
                onClick={() => {
                  if (!isLocked) toggleStep(step.step);
                }}
                className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border cursor-pointer transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#00FFC6]/15 border-[#00FFC6] text-[#00FFC6] glow-accent"
                    : isLocked
                    ? "bg-muted border-border text-muted-foreground/40 cursor-not-allowed"
                    : "bg-secondary/15 border-secondary/40 text-secondary hover:border-primary"
                }`}
                onMouseEnter={() => {
                  if (!isLocked) soundManager.playHover();
                }}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 animate-[bounce_1s_infinite]" />
                ) : isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </div>

              {/* Quest Card Container */}
              <div className="flex-1">
                <Card 
                  className={`glass border-border/40 overflow-hidden relative transition-all duration-300 ${
                    !isLocked && "hover:glow hover:border-primary/40"
                  } ${isLocked && "backdrop-blur-md bg-secondary/5 border-border/20"}`}
                >
                  {/* Lock Blur Layer Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-[2.5px] pointer-events-none">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase bg-card/80 px-2 py-1 rounded border border-border/30">
                        <Lock className="h-3 w-3" /> Locked: complete previous phase
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-[#00FFC6] bg-[#00FFC6]/10 px-1.5 py-0.5 rounded border border-[#00FFC6]/20">
                          STAGE {step.step}
                        </span>
                        <span className="font-heading text-[10px] font-black uppercase tracking-wider text-primary">
                          {tierName} Node
                        </span>
                      </div>
                      <h3 className={`text-base font-heading font-bold ${isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed max-w-2xl font-sans">
                        {step.description}
                      </p>

                      {/* Associated Files mapping badges */}
                      {step.files && step.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {step.files.map((file) => (
                            <div 
                              key={file}
                              className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground/75 bg-secondary/35 border border-border/50 px-2 py-1 rounded-lg hover:text-foreground cursor-pointer transition-colors"
                            >
                              <FileCode className="h-3 w-3 text-secondary" />
                              {file}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quest Button */}
                    {!isLocked && (
                      <button
                        onClick={() => toggleStep(step.step)}
                        className={`shrink-0 flex items-center gap-1.5 font-heading font-black uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isCompleted
                            ? "bg-[#00FFC6]/10 border-[#00FFC6]/30 text-[#00FFC6]"
                            : "bg-primary border-primary text-white hover:brightness-110 active:scale-95"
                        }`}
                      >
                        {isCompleted ? "COMPLETED" : "MARK STAGE COMPLETED"}
                      </button>
                    )}
                  </div>
                </Card>
              </div>

            </motion.div>
          );
        })}
      </motion.div>

    </div>
  );
}
