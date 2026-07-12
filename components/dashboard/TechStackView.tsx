"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Layout, Server, Database, Hammer, Info, HelpCircle, Globe, Cloud } from "lucide-react";
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

// Preset documentation URL mappings and details for technologies
const TECH_PORTAL: Record<
  string,
  { usage: number; files: number; docsUrl: string; tips: string }
> = {
  React: {
    usage: 95,
    files: 48,
    docsUrl: "https://react.dev",
    tips: "Utilize hooks carefully; avoid triggering unnecessary re-renders in deep trees.",
  },
  Next: {
    usage: 92,
    files: 32,
    docsUrl: "https://nextjs.org",
    tips: "Ensure components are Client Components (use client) only when relying on state/hooks.",
  },
  Tailwind: {
    usage: 88,
    files: 54,
    docsUrl: "https://tailwindcss.com",
    tips: "Abstract complex styling classes using custom layers or theme tokens in globals.css.",
  },
  TypeScript: {
    usage: 90,
    files: 110,
    docsUrl: "https://typescriptlang.org",
    tips: "Keep compiler configurations strict and avoid using explicit 'any' types.",
  },
  "Node.js": {
    usage: 82,
    files: 15,
    docsUrl: "https://nodejs.org",
    tips: "Leverage native async/await patterns for clean non-blocking network streams.",
  },
  FastAPI: {
    usage: 75,
    files: 12,
    docsUrl: "https://fastapi.tiangolo.com",
    tips: "Write typed Pydantic models to guarantee request-response schema stability.",
  },
  Uvicorn: {
    usage: 70,
    files: 4,
    docsUrl: "https://uvicorn.org",
    tips: "Run dev servers reload profile only inside local staging test profiles.",
  },
};

export function TechStackView() {
  const { data } = useAnalysisData();
  const { techStack } = data;
  const [selectedTech, setSelectedTech] = useState<string>(() => {
    return techStack && techStack.length > 0 ? techStack[0].name : "";
  });

  const currentTechStackStr = techStack.map((t) => t.name).join(",");
  const [lastTechStackStr, setLastTechStackStr] = useState(currentTechStackStr);
  if (currentTechStackStr !== lastTechStackStr) {
    setLastTechStackStr(currentTechStackStr);
    setSelectedTech(techStack.length > 0 ? techStack[0].name : "");
  }

  const techStack = (analysisResult.technologies || []).map((item) => ({
    name: item.display_name,
    category: (item.category.toLowerCase() as any) || "other",
    version: item.version,
    evidence: item.evidence,
    coverage: item.coverage,
  }));

  const getTechDetails = (name: string) => {
    return TECH_PORTAL[name] ?? {
      usage: 55,
      files: 8,
      docsUrl: `https://github.com/search?q=${name}`,
      tips: `Integrated dependency parsed in codebase config. Consult the project README for setup details.`,
    };
  };

  const selectedDetails = getTechDetails(selectedTech);

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
          Technology Analysis
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Orbital system mapping libraries, languages, and bundler utilities indexed in this workspace.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 items-start">
        {/* Left Side: 3D-like Orbital Map */}
        <Card className="glass border-border/40 md:col-span-2 h-[480px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 font-mono text-[9px] text-[#00FFC6]/60">
            ORBIT_ENGINE: ROTATING
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.03)_0%,transparent_60%)]" />

          {/* Central AI Core Orb */}
          <div className="relative h-72 w-72 flex items-center justify-center">
            
            {/* Concentric orbital rings */}
            <div className="absolute h-64 w-64 rounded-full border border-border/40 border-dashed animate-[spin_40s_linear_infinite]" />
            <div className="absolute h-40 w-40 rounded-full border border-border/20 border-dotted" />

            {/* Orbit wrapper rotating */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {techStack.map((tech, idx) => {
                const angle = (idx * (2 * Math.PI)) / techStack.length;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isSelected = selectedTech === tech.name;

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
                      <p>{details.description}</p>
                      {item.evidence && (
                        <p className="text-[9px] text-muted-foreground/50 font-mono select-all truncate" title={item.evidence}>
                          Evidence: {item.evidence}
                        </p>
                      )}
                    </CardContent>
                  </div>
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
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-black">{selectedDetails.files}</span>
                    <span className="text-xs text-muted-foreground">source objects</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">CODEBASE_DENSITY: HIGH</p>
                </div>
              </div>

              {/* Onboarding recommendation tip */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#00FFC6] flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  AI Onboarding Guidance
                </h4>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm leading-relaxed text-foreground/90 font-sans">
                  {selectedDetails.tips}
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 border-t border-border/20 bg-secondary/15 flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
            <span>Hover and click satellite nodes on the orbital layout to fetch detailed diagnostics logs.</span>
          </div>
        </Card>
      </div>

    </div>
  );
}
