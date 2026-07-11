"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, FileCode, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEVELOPER_ROLES } from "@/lib/constants";
import { useAnalysis } from "@/lib/AnalysisContext";
import type { DeveloperRole } from "@/types";

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

export function OnboardingRoadmapView() {
  const { analysisResult } = useAnalysis();
  const [activeRole, setActiveRole] = useState<DeveloperRole>("frontend");
  const [completedSteps, setCompletedSteps] = useState<Record<DeveloperRole, Record<number, boolean>>>({
    frontend: { 1: true },
    backend: {},
    fullstack: {},
    opensource: {},
  });

  if (!analysisResult) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No active repository details found. Please analyze a repository.
      </div>
    );
  }

  const steps = analysisResult.roadmap.map((item) => ({
    step: item.step_number,
    title: item.title,
    description: item.description,
    files: []
  }));
  const roleCompleted = completedSteps[activeRole] ?? {};

  const toggleStep = (stepNumber: number) => {
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

  // Find the first uncompleted step (which represents the "Current" state)
  const getStepState = (stepNumber: number) => {
    if (roleCompleted[stepNumber]) return "completed";
    
    // Check if it's the current active step (first uncompleted step)
    const firstUncompleted = steps.find((s) => !roleCompleted[s.step]);
    if (firstUncompleted && firstUncompleted.step === stepNumber) return "current";
    
    // If all are completed, no step is current
    return "upcoming";
  };

  const totalStepsCount = steps.length;
  const completedCount = Object.keys(roleCompleted).length;
  const progressPercent = Math.round((completedCount / totalStepsCount) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Onboarding Roadmap
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          AI-generated path showing critical steps to understand the repository based on your developer role.
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/40 pb-4">
        {DEVELOPER_ROLES.map((role) => {
          const isSelected = activeRole === role.value;

          return (
            <button
              key={role.value}
              onClick={() => setActiveRole(role.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overall Progress Panel */}
      <Card className="glass border-border/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Onboarding Progress
            </h3>
            <p className="text-xs text-muted-foreground">
              Completed {completedCount} of {totalStepsCount} recommended learning steps
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
            <div className="h-2 flex-1 bg-secondary/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" as const }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <span className="font-mono text-xs font-bold text-foreground w-8 text-right">
              {progressPercent}%
            </span>
          </div>
        </div>
      </Card>

      {/* Timeline Steps layout */}
      <motion.div
        key={activeRole}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative border-l border-border/40 ml-4 pl-6 space-y-6 py-2"
      >
        <AnimatePresence mode="popLayout">
          {steps.map((stepItem) => {
            const stepState = getStepState(stepItem.step);
            const isCompleted = stepState === "completed";
            const isCurrent = stepState === "current";

            return (
              <motion.div
                key={stepItem.step}
                variants={itemVariants}
                className="relative"
              >
                {/* Visual Timeline Marker Node */}
                <div
                  onClick={() => toggleStep(stepItem.step)}
                  className={`absolute -left-[37px] top-4 flex h-6.5 w-6.5 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white hover:brightness-110"
                      : isCurrent
                      ? "bg-primary border-primary text-white shadow-[0_0_12px_var(--color-primary)/30] animate-pulse"
                      : "bg-background border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold font-mono">{stepItem.step}</span>
                  )}
                </div>

                {/* Step card container */}
                <Card
                  onClick={() => {
                    // Clicking the card toggles it to Completed if not active
                    if (isCurrent || isCompleted) toggleStep(stepItem.step);
                  }}
                  className={`glass border transition-all duration-200 hover:glow-sm cursor-pointer ${
                    isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/[2%]"
                      : isCurrent
                      ? "border-primary/40 bg-primary/[2%]"
                      : "border-border/30"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isCompleted ? "default" : isCurrent ? "secondary" : "outline"}
                          className={`text-[9px] uppercase tracking-wider ${
                            isCompleted ? "bg-emerald-500 hover:bg-emerald-500 text-white" : ""
                          }`}
                        >
                          {stepState}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className={`text-base font-bold mt-2 ${isCompleted ? "line-through text-muted-foreground/80" : "text-foreground"}`}>
                      {stepItem.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0 space-y-3.5">
                    <p className={`text-xs sm:text-sm leading-relaxed ${isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      {stepItem.description}
                    </p>

                    {stepItem.files && stepItem.files.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                          <FileCode className="h-3.5 w-3.5" />
                          Recommended Files to Read
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {stepItem.files.map((file) => (
                            <Badge
                              key={file}
                              variant="outline"
                              className="font-mono text-[10px] bg-secondary/20 border-border/40 hover:bg-secondary/40 text-foreground"
                            >
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Info Tip */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/30 bg-secondary/25 p-4 text-xs text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="leading-relaxed">
          Click on any timeline step number or card to mark it as completed and update your onboarding progress. Your checkmarks are persisted locally in memory.
        </p>
      </div>
    </div>
  );
}
