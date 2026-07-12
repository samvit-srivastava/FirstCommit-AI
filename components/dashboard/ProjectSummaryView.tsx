"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Star, Code2, Shield, ExternalLink, Activity, Cpu, Compass, Clock, GitBranch
} from "lucide-react";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { useAnalysis } from "@/lib/AnalysisContext";
import { soundManager } from "@/lib/sounds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Custom Premium Markdown Parser (Notion AI / Cursor Docs style) ──────────

function renderInlineMarkdown(text: string): React.ReactNode[] {
  let keyIndex = 0;
  
  // Parse bold (**text**), italic (*text* or _text_), code (`code`)
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const splitParts = text.split(regex);
  
  return splitParts.map((part) => {
    keyIndex++;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={keyIndex} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={keyIndex} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-primary-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={keyIndex} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function parseMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentListItems: React.ReactNode[] = [];

  const pushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="my-3 space-y-2 list-none pl-1">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      pushList(idx);
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${idx}`} className="my-4 overflow-hidden rounded-xl border border-white/5 bg-[#050816]/70 p-4 font-mono text-[11px] text-foreground/90 select-text shadow-inner">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground/40 font-sans border-b border-white/5 pb-2 mb-2 select-none">
              <span>SOURCE CODE PREVIEW</span>
              <span className="text-[9px] uppercase tracking-wider font-bold">MONO</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre leading-relaxed">{codeBlockLines.join("\n")}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("# ")) {
      pushList(idx);
      elements.push(
        <h1 key={idx} className="text-xl font-heading font-black text-foreground mt-6 mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
          {renderInlineMarkdown(trimmed.substring(2))}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      pushList(idx);
      elements.push(
        <h2 key={idx} className="text-lg font-heading font-bold text-foreground mt-5 mb-2.5 flex items-center gap-2 border-b border-white/[0.02] pb-1">
          {renderInlineMarkdown(trimmed.substring(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("### ")) {
      pushList(idx);
      elements.push(
        <h3 key={idx} className="text-sm font-heading font-bold text-[#00FFC6] mt-4 mb-2 flex items-center gap-2">
          {renderInlineMarkdown(trimmed.substring(4))}
        </h3>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      pushList(idx);
      elements.push(
        <blockquote key={idx} className="border-l-2 border-primary/50 pl-4 py-1.5 my-3.5 text-muted-foreground/85 italic bg-white/[0.01] rounded-r leading-relaxed">
          {renderInlineMarkdown(trimmed.substring(2))}
        </blockquote>
      );
      return;
    }

    // List item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const cleanedText = trimmed.replace(/^([-*•]|\d+\.)\s+/, "");
      currentListItems.push(
        <li key={`li-${idx}-${cleanedText.substring(0, 10)}`} className="flex items-start gap-2 text-xs text-muted-foreground/80 leading-relaxed font-sans font-medium">
          <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{renderInlineMarkdown(cleanedText)}</span>
        </li>
      );
      return;
    }

    // Empty line
    if (!trimmed) {
      pushList(idx);
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Normal paragraph
    pushList(idx);
    elements.push(
      <p key={idx} className="text-xs sm:text-sm text-muted-foreground/80 my-2.5 leading-relaxed font-sans font-medium">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  // Push final remaining list if any
  pushList("final");

  return elements;
}

// ─── CountUp Animation Component ─────────────────────────────────────────────

function CountUp({ to }: { to: string }) {
  const numeric = parseInt(to.replace(/[^0-9]/g, ""), 10);
  const suffix = to.replace(/[0-9]/g, "");
  const [count, setCount] = useState(() => (isNaN(numeric) ? 0 : 0));

  useEffect(() => {
    if (isNaN(numeric)) return;
    let start = 0;
    const duration = 1000;
    const steps = duration / 16;
    const increment = Math.ceil(numeric / steps) || 1;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numeric]);

  if (isNaN(numeric)) return <span>{to}</span>;
  return <span>{count}{suffix}</span>;
}

// ─── InfoRow Component (Overview Twin) ───────────────────────────────────────

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
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

// ─── Framing Variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProjectSummaryView() {
  const { data } = useAnalysisData();
  const { summary, techStack } = data;
  const { analysisResult } = useAnalysis();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto select-none font-sans"
    >
      {/* 1. Compact Hero Panel (Overview Twin) */}
      <motion.div 
        variants={cardVariants}
        className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl px-6 py-4.5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="absolute top-0 left-0 h-[1px] w-full bg-[linear-gradient(90deg,transparent,#7C5CFF,#00D4FF,transparent)] opacity-40" />
        
        <div>
          <h1 className="text-xl font-heading font-black tracking-tight text-foreground">
            Repository Summary
          </h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5 leading-relaxed font-medium">
            Executive summary and architectural highlights of your codebase.
          </p>
        </div>

        {/* Telemetry bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground/40 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">REPOSITORY:</span>
            <span className="text-foreground font-bold">{summary.name}</span>
          </div>
          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 font-sans font-bold text-[9px]">LANGUAGE:</span>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold bg-white/[0.04] border border-white/10 backdrop-blur-sm shadow-sm select-none">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] bg-clip-text text-transparent font-black">
                {summary.language || "TypeScript"}
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

      {/* 2. Executive Summary Card */}
      <motion.div variants={cardVariants}>
        <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 shadow-lg group">
          <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-base font-heading font-black text-foreground flex items-center gap-2.5">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <p className="text-base leading-relaxed text-foreground/90 font-sans font-bold">
              {summary.description || "No project overview description available."}
            </p>
            {summary.purpose && (
              <div className="p-4 bg-secondary/15 rounded-xl border border-border/30 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <span className="text-primary font-bold">Primary Mission:</span> {summary.purpose}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Highlights Cards Grid */}
      <motion.div
        variants={containerVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {summary.architecture && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => soundManager.playHover()}
            className="cursor-pointer"
          >
            <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 hover:glow shadow-lg group h-full">
              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  <Cpu className="h-5 w-5 text-primary group-hover:text-[#00D4FF] transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-mono font-bold tracking-tight text-foreground">
                    Structure
                  </p>
                  <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#00FFC6]/80 mt-1">
                    Architecture style
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {summary.architecture}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {summary.stars > 0 && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => soundManager.playHover()}
            className="cursor-pointer"
          >
            <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 hover:glow shadow-lg group h-full">
              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  <Star className="h-5 w-5 text-primary group-hover:text-[#00D4FF] transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-mono font-bold tracking-tight text-foreground">
                    <CountUp to={String(summary.stars)} />
                  </p>
                  <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#00FFC6]/80 mt-1">
                    GitHub Stars
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Codebase community popularity score
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {summary.language && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => soundManager.playHover()}
            className="cursor-pointer"
          >
            <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 hover:glow shadow-lg group h-full">
              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  <Code2 className="h-5 w-5 text-primary group-hover:text-[#00D4FF] transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-mono font-bold tracking-tight text-foreground">
                    {summary.language}
                  </p>
                  <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#00FFC6]/80 mt-1">
                    Primary Language
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Core index language execution runtime
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* 4. Details Split Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Tech stack pills */}
        {techStack && techStack.length > 0 && (
          <motion.div variants={cardVariants} className="md:col-span-2">
            <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 shadow-lg group h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
              <div>
                <CardHeader className="pb-3 border-b border-border/10">
                  <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2.5">
                    <Activity className="h-4.5 w-4.5 text-[#00FFC6]" />
                    Detected Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex flex-wrap gap-2.5">
                  {techStack.map((tech) => (
                    <motion.div
                      key={tech.name}
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ duration: 0.15 }}
                      onMouseEnter={() => soundManager.playHover()}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-mono font-bold bg-white/[0.04] border border-white/10 backdrop-blur-sm select-none cursor-default hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 transition-colors"
                    >
                      <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] bg-clip-text text-transparent font-black">
                        {tech.name}
                      </span>
                    </motion.div>
                  ))}
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Right Side: Repository Metadata (RepoInfoPanel Twin) */}
        <motion.div variants={cardVariants}>
          <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 shadow-lg group">
            <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2.5">
                <Compass className="h-4.5 w-4.5 text-primary" />
                Repository Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {summary.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {summary.description}
                </p>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-2.5">
                <InfoRow
                  icon={Star}
                  label="Stars"
                  value={
                    summary.stars >= 1000
                      ? `${Math.round(summary.stars / 1000)}k`
                      : summary.stars
                  }
                />
                <InfoRow
                  icon={Code2}
                  label="Language"
                  value={
                    <Badge variant="secondary" className="text-xs font-mono">
                      {summary.language}
                    </Badge>
                  }
                />
                <InfoRow
                  icon={GitBranch}
                  label="Default Branch"
                  value="main"
                />
                <InfoRow
                  icon={Clock}
                  label="Analyzed"
                  value="Just now"
                />
              </div>

              {summary.url && (
                <>
                  <Separator className="bg-border/30" />
                  <a
                    href={summary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundManager.playClick()}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-center gap-2 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary transition-all"
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View on GitHub</span>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 5. README Document Box */}
      {analysisResult?.readme && (
        <motion.div variants={cardVariants}>
          <Card className="glass border-border/40 relative overflow-hidden transition-all duration-300 shadow-lg group">
            <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary/45 rounded-bl-sm group-hover:bg-[#00FFC6] transition-colors" />
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2.5">
                <Shield className="h-4.5 w-4.5 text-primary" />
                README.md Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-white/5 bg-[#050816]/40 p-6 select-text">
                <div className="space-y-4 pr-2">
                  {parseMarkdown(analysisResult.readme)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
