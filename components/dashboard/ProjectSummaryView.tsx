"use client";

import { motion } from "framer-motion";
import { BookOpen, Star, Code2, Globe, Cpu, AlertCircle, Compass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAnalysis } from "@/lib/mock-data";

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
  const { summary } = mockAnalysis;

  const insights = [
    {
      label: "Language",
      value: summary.language,
      icon: Code2,
      description: "Primary codebase language",
    },
    {
      label: "Popularity",
      value: `${(summary.stars / 1000).toFixed(0)}k Stars`,
      icon: Star,
      description: "GitHub community stars",
    },
    {
      label: "Architecture",
      value: "Monorepo",
      icon: Cpu,
      description: "Turborepo & multi-package system",
    },
    {
      label: "Deployment",
      value: "Vercel Native",
      icon: Globe,
      description: "Optimized serverless support",
    },
  ];

  const highlights = [
    {
      title: "File-system Based Routing",
      description:
        "Supports App Router layouts, templates, loading, and error states out of the box with nested page matching.",
    },
    {
      title: "Optimized Rendering Strategies",
      description:
        "Seamless support for Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR).",
    },
    {
      title: "Zero-config Bundling",
      description:
        "Bundled with Turbopack and SWC compilers written in Rust, delivering blazing fast local compilation speeds.",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Title section */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Repository Summary
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          AI-generated insights and architectural overview of{" "}
          <span className="font-semibold text-foreground">{summary.name}</span>.
        </p>
      </motion.div>

      {/* Main summary card */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/40 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
              {summary.description}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key insights cards */}
      <motion.div
        variants={containerVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {insights.map((insight) => (
          <motion.div key={insight.label} variants={itemVariants}>
            <Card className="glass-subtle border-border/30 transition-all duration-200 hover:glow-sm h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <insight.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {insight.label}
                  </p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {insight.value}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Details (Purpose & Architecture) */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/40 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Core Purpose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary.purpose}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/40 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary.architecture}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Highlights Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Key Codebase Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-secondary/35 border border-border/20 space-y-1.5"
              >
                <h4 className="text-sm font-semibold text-foreground">
                  {highlight.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
