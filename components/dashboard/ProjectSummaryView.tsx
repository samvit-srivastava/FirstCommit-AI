"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, Code2, Globe, Cpu, AlertTriangle, Compass, CheckCircle2, ListCollapse, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { soundManager } from "@/lib/sounds";

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export function ProjectSummaryView() {
  const { data } = useAnalysisData();
  const { summary } = data;
  const [selectedNode, setSelectedNode] = useState<string>("parser");

  const insights = [
    {
      label: "Primary Language",
      value: summary.language,
      icon: Code2,
      description: "Codebase language index",
    },
    {
      label: "Community Score",
      value: `${summary.stars} Stars`,
      icon: Star,
      description: "GitHub stars telemetry",
    },
    {
      label: "Architecture Style",
      value: "Modular MVC",
      icon: Cpu,
      description: "Component dependency patterns",
    },
    {
      label: "Web Target",
      value: "Production Ready",
      icon: Globe,
      description: "Hosting compatibility tier",
    },
  ];

  const DIAGRAM_NODES = [
    { id: "input", label: "GitHub URL", description: "Clones repository structure from public URL targets.", icon: Globe },
    { id: "parser", label: "Repo Parser", description: "Detects package dependencies, languages, and settings.", icon: Cpu },
    { id: "graph", label: "Knowledge Graph", description: "Builds semantic mappings of folder structures.", icon: ListCollapse },
    { id: "roadmap", label: "Roadmap Engine", description: "Generates tailored step timelines for roles.", icon: Compass },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-5xl mx-auto select-none"
    >
      {/* Title section */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
            Architecture Discovery
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            AI telemetry metrics and code flow diagrams for{" "}
            <span className="font-semibold text-[#00D4FF]">{summary.name}</span>.
          </p>
        </div>
      </motion.div>

      {/* Overview & Purpose */}
      <div className="grid gap-6 md:grid-cols-12">
        <motion.div variants={itemVariants} className="md:col-span-8 space-y-6">
          <Card className="glass border-border/40 overflow-hidden relative">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                Project Purpose & Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-sans">
                {summary.description}
              </p>
              <div className="p-4 bg-secondary/15 rounded-xl border border-border/30 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <span className="text-primary font-bold">AI Summary:</span> {summary.purpose}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technical overview sidebar metrics */}
        <motion.div variants={itemVariants} className="md:col-span-4">
          <Card className="glass border-border/40 h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                HUD Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs text-foreground/80 flex-1 flex flex-col justify-center">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">CLONE_STATUS:</span>
                <span className="text-[#00FFC6] font-bold">STABLE</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">BRANCH:</span>
                <span className="text-secondary font-bold">main</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2 flex-col gap-1">
                <span className="text-muted-foreground">LOCAL_PATH:</span>
                <span className="text-[10px] text-muted-foreground/60 break-all bg-secondary/30 p-1.5 rounded">{summary.architecture}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Key insights cards */}
      <motion.div
        variants={containerVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {insights.map((insight) => (
          <motion.div 
            key={insight.label} 
            variants={itemVariants}
            whileHover={{ y: -3 }}
            onMouseEnter={() => soundManager.playHover()}
            className="cursor-pointer"
          >
            <Card className="glass-subtle border-border/30 transition-all duration-300 hover:glow-sm hover:border-primary/40 h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <insight.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                    {insight.label}
                  </p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {insight.value}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5 leading-tight">
                    {insight.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 3. Interactive Code Pipeline Block Diagram */}
      <motion.div variants={itemVariants} className="w-full">
        <Card className="glass border-border/40 p-6 relative overflow-hidden">
          <CardHeader className="p-0 pb-4 border-b border-border/20 mb-6">
            <CardTitle className="text-base font-heading font-bold uppercase tracking-wider text-foreground">
              Repository Compilation & Flow Diagram
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Select any block inside the AI pipeline to analyze mapping descriptions.
            </CardDescription>
          </CardHeader>

          {/* Interactive diagram grid */}
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
            {DIAGRAM_NODES.map((node, idx) => {
              const NodeIcon = node.icon;
              const isSelected = selectedNode === node.id;
              return (
                <div key={node.id} className="flex flex-col md:flex-row items-center w-full md:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedNode(node.id);
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className={`h-24 w-40 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "bg-primary/15 border-primary text-foreground glow"
                        : "bg-secondary/10 border-border/60 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <NodeIcon className={`h-6 w-6 ${isSelected ? 'text-[#00FFC6]' : 'text-primary/75'}`} />
                    <span className="font-heading text-xs font-bold uppercase tracking-wider">{node.label}</span>
                  </motion.div>

                  {idx < DIAGRAM_NODES.length - 1 && (
                    <div className="flex items-center justify-center h-8 md:h-auto w-auto md:w-16 rotate-90 md:rotate-0 mt-2 md:mt-0">
                      <ArrowRight className="h-4 w-4 text-primary/45 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Node descriptions board */}
          <div className="mt-6 p-4 bg-secondary/15 rounded-xl border border-border/30 h-20 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNode}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-xs sm:text-sm font-sans text-muted-foreground"
              >
                <span className="text-[#00FFC6] font-bold uppercase font-mono mr-1.5">
                  [{selectedNode}]:
                </span>
                {DIAGRAM_NODES.find((node) => node.id === selectedNode)?.description}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Strengths, Weaknesses & Recommendations */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Strengths */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-emerald-500/20 h-full relative overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/20">
              <CardTitle className="text-sm font-heading font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>• Modular design pattern simplifies component isolation.</p>
              <p>• Fast build execution times optimized by Rust tooling.</p>
              <p>• Low redundancy levels with high type coverage safety.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weaknesses */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-amber-500/20 h-full relative overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/20">
              <CardTitle className="text-sm font-heading font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Identified Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>• Low unit testing coverage across sub-modules.</p>
              <p>• Lack of descriptive JSDoc block parameter annotations.</p>
              <p>• Empty configuration defaults causing build locks.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-primary/20 h-full relative overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/20">
              <CardTitle className="text-sm font-heading font-bold uppercase tracking-wider text-[#00D4FF] flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-[#00D4FF]" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>• Introduce Playwright integration for e2e validation flows.</p>
              <p>• Configure CI pipelines to enforce prettier styling linting.</p>
              <p>• Write unit testing models for helper utility functions.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
}
