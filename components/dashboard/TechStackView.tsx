"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Layout,
  Server,
  Database,
  Hammer,
  HelpCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysisData } from "@/hooks/use-analysis-data";

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  language: { label: "Language", icon: Code2, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  frontend: { label: "Frontend", icon: Layout, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  backend: { label: "Backend", icon: Server, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  database: { label: "Database", icon: Database, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  devops: { label: "DevOps", icon: Hammer, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  other: { label: "Other", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
} as const;

type CategoryKey = keyof typeof CATEGORY_MAP;

function getCatConfig(category: string) {
  const key = category.toLowerCase() as CategoryKey;
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.other;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
};

// ─── Category filter chips ────────────────────────────────────────────────────

const ALL_CATEGORIES = ["all", "language", "frontend", "backend", "database", "devops", "other"] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export function TechStackView() {
  const { data } = useAnalysisData();
  const { techStack } = data;

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTech = activeCategory === "all"
    ? techStack
    : techStack.filter((t) => t.category === activeCategory);

  const availableCategories = ALL_CATEGORIES.filter(
    (cat) => cat === "all" || techStack.some((t) => t.category === cat)
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
          Technology Analysis
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {techStack.length} frameworks, languages, and tools indexed in this repository.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((cat) => {
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
              {config && <config.icon className="h-3 w-3" />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tech Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        layout
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
              >
                <motion.div
                  whileHover={{ y: -3, scale: 1.012 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  <Card className="glass border-white/5 bg-[#050816]/10 h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 border border-primary/10">
                          <catConfig.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-heading font-bold text-foreground truncate">
                            {item.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-[9px] mt-1 px-1.5 py-0 ${catConfig.color}`}
                          >
                            {catConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end">
                      <p className="text-[11px] leading-relaxed text-muted-foreground/70 font-sans">
                        Detected {item.category} dependency indexed in the repository.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
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
