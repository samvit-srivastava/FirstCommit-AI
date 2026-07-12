"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Layout, Server, Database, Hammer, Info, HelpCircle, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/lib/AnalysisContext";

// Quick shim for CpuIcon so we don't import another module unnecessarily
const CpuIconShim = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 9h6v6H9z" />
    <path d="M9 1v3" />
    <path d="M15 1v3" />
    <path d="M9 20v3" />
    <path d="M15 20v3" />
    <path d="M20 9h3" />
    <path d="M20 15h3" />
    <path d="M1 9h3" />
    <path d="M1 15h3" />
  </svg>
);

const CATEGORY_MAP = {
  language: { label: "Languages", icon: Code2, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  frontend: { label: "Frontend", icon: Layout, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  backend: { label: "Backend", icon: Server, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  database: { label: "Database", icon: Database, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  orm: { label: "ORM", icon: Database, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  testing: { label: "Testing", icon: Hammer, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  "build tool": { label: "Build Tools", icon: CpuIconShim, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  devops: { label: "DevOps", icon: Hammer, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  cloud: { label: "Cloud", icon: Globe, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  "package manager": { label: "Package Manager", icon: Hammer, color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  other: { label: "Other", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
} as const;

type CategoryKey = keyof typeof CATEGORY_MAP;

function getCatConfig(category: string) {
  const key = category.toLowerCase() as CategoryKey;
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.other;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.985 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring" as const, stiffness: 120, damping: 14 } 
  },
};

export function TechStackView() {
  const { analysisResult } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const technologies = (analysisResult?.technologies || []).map((item) => ({
    name: item.display_name,
    category: (item.category?.toLowerCase() || "other"),
    version: item.version,
    evidence: item.evidence,
    coverage: item.coverage || 40,
  }));

  const filteredTech = activeCategory === "all"
    ? technologies
    : technologies.filter((t) => t.category === activeCategory);

  const categories = ["all", ...Array.from(new Set(technologies.map((t) => t.category)))];

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
          Technology Analysis
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Libraries, languages, and bundler utilities indexed in this workspace.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const config = cat !== "all" ? getCatConfig(cat) : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-white/5 bg-white/[0.01] text-muted-foreground/60 hover:border-white/10 hover:text-foreground"
              }`}
            >
              {config && <config.icon className="h-3.5 w-3.5" />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tech Cards Grid */}
      <motion.div
        layout
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredTech.map((item) => {
            const catConfig = getCatConfig(item.category);
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
                <Card className="glass border-white/10 h-full flex flex-col justify-between transition-all duration-200 hover:glow-sm relative bg-white/[0.01] hover:bg-white/[0.03]">
                  <div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          {catConfig && <catConfig.icon className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{item.name}</span>
                            {item.version && (
                              <span className="text-[10px] bg-secondary/85 text-secondary-foreground px-1.5 py-0.5 rounded font-mono font-normal">
                                v{item.version}
                              </span>
                            )}
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
                    <CardContent className="p-4 pt-2 text-xs leading-relaxed text-muted-foreground space-y-2">
                      {item.evidence && (
                        <p className="text-[9px] text-muted-foreground/50 font-mono select-all truncate" title={item.evidence}>
                          Evidence: {item.evidence}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  {/* Skill level / Codebase coverage progress indicator */}
                  <div className="p-4 pt-0 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                      <span>Codebase Coverage</span>
                      <span className="text-foreground">{item.coverage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.coverage}%` }}
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

      {filteredTech.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Info className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm">No technologies found in this category.</p>
        </div>
      )}
    </div>
  );
}
