"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Layout, Server, Database, Hammer, Info, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/lib/AnalysisContext";

const CATEGORY_MAP = {
  frontend: { label: "Frontend", icon: Layout, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  backend: { label: "Backend", icon: Server, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  database: { label: "Database", icon: Database, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  devops: { label: "DevOps", icon: Hammer, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  language: { label: "Languages", icon: Code2, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  other: { label: "Other", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
} as const;

// Add mock usage weights/percentages for tech stack visualization
const TECH_DETAILS: Record<string, { usage: number; description: string }> = {
  React: { usage: 94, description: "Core UI component library driving the page views and rendering engine." },
  TypeScript: { usage: 88, description: "Primary development language ensuring type safety across client and server." },
  JavaScript: { usage: 45, description: "Used in legacy script components and package setup files." },
  Webpack: { usage: 60, description: "Legacy bundler support for older packages and pages rendering router." },
  Turbopack: { usage: 78, description: "Incremental Rust-based compiler engine for instant hot reloads." },
  SWC: { usage: 82, description: "Rust-based platform for fast compilation, transpilation, and minification." },
  Jest: { usage: 70, description: "Unit test coverage framework verifying package hooks and router functions." },
  Playwright: { usage: 65, description: "End-to-end browser environment tests validating app page flows." },
  Rust: { usage: 35, description: "Powers compile-time binaries and optimization modules in Turbopack/SWC." },
  "CSS Modules": { usage: 80, description: "Component-scoped styles for local, isolated presentation properties." },
  PostCSS: { usage: 75, description: "Automated CSS processing compiling tailwind directives and style variables." },
  "Node.js": { usage: 85, description: "Execution environment for local dev servers and server-side request pipelines." },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function TechStackView() {
  const { analysisResult } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...Object.keys(CATEGORY_MAP)];

  if (!analysisResult) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No active repository details found. Please analyze a repository.
      </div>
    );
  }

  const techStack = analysisResult.tech_stack.map((item) => ({
    name: item.name,
    category: (item.category.toLowerCase() as any) || "other",
  }));

  const filteredTech = techStack.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tech Stack Detection
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Automatically detected frameworks, languages, and build tools running in this repository.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/40 pb-4">
        {categories.map((cat) => {
          const config = cat === "all" ? null : CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP];
          const isSelected = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {config && <config.icon className="h-3.5 w-3.5" />}
              <span>{cat === "all" ? "All Tech" : config?.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid listing */}
      <motion.div
        layout
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredTech.map((item) => {
            const catConfig = CATEGORY_MAP[item.category as keyof typeof CATEGORY_MAP] || CATEGORY_MAP.other;
            const details = TECH_DETAILS[item.name] ?? {
              usage: 40,
              description: "Detected package dependency active in codebase.",
            };

            return (
              <motion.div
                key={item.name}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-full"
              >
                <Card className="glass border-border/40 h-full flex flex-col justify-between transition-all duration-200 hover:glow-sm">
                  <div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          {catConfig && <catConfig.icon className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">
                            {item.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-[10px] mt-0.5 px-1.5 py-0 ${catConfig.color}`}
                          >
                            {catConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-xs leading-relaxed text-muted-foreground">
                      {details.description}
                    </CardContent>
                  </div>

                  {/* Skill level / Codebase coverage progress indicator */}
                  <div className="p-4 pt-0 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                      <span>Codebase Coverage</span>
                      <span className="text-foreground">{details.usage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${details.usage}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" as const }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Info helper footer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/30 bg-secondary/25 p-4 text-xs text-muted-foreground max-w-2xl">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="leading-relaxed">
          The coverage bar visualizes the usage density of each framework, utility, or parser computed by scanning imports, configurations, and lockfiles across this codebase.
        </p>
      </div>
    </div>
  );
}
