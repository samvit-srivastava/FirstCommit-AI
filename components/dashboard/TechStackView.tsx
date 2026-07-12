"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Info, Cpu, Link as LinkIcon, FileText, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import { soundManager } from "@/lib/sounds";

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

  // Handle orbits coordinate layouts (Radius 120px)
  const radius = 125;
  const centerNodeX = 0;
  const centerNodeY = 0;

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

                return (
                  <motion.div
                    key={tech.name}
                    className="absolute"
                    style={{
                      x: x + centerNodeX,
                      y: y + centerNodeY,
                    }}
                    whileHover={{ scale: 1.15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playClick();
                      setSelectedTech(tech.name);
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                  >
                    <div 
                      className={`h-11 w-11 flex items-center justify-center rounded-xl border text-[10px] font-heading font-black cursor-pointer shadow-lg backdrop-blur-md transition-all duration-300 ${
                        isSelected
                          ? "bg-primary border-primary text-white glow-sm"
                          : "bg-[#050816]/75 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tech.name.substring(0, 4).toUpperCase()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Central static Core */}
            <div className="relative h-20 w-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#7C5CFF_0%,#050816_80%)] border border-primary/50 flex items-center justify-center glow-sm animate-pulse duration-[3000ms]">
              <Cpu className="h-5 w-5 text-[#00FFC6]" />
            </div>

          </div>
        </Card>

        {/* Right Side: Radar / Diagnostic panel */}
        <Card className="glass border-border/40 md:col-span-3 h-[480px] flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[#00FFC6]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Diagnostic info block */}
          <div className="flex-1 flex flex-col">
            <CardHeader className="p-5 pb-3 border-b border-border/20">
              <div className="flex items-center justify-between gap-3">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-mono text-[10px]">
                  ACTIVE_NODE
                </Badge>
                <a 
                  href={selectedDetails.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 cursor-pointer"
                  onClick={() => soundManager.playClick()}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Documentation Docs
                </a>
              </div>
              <CardTitle className="text-xl font-heading font-black text-foreground mt-3 flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-[#00FFC6]" />
                {selectedTech} Diagnostic Info
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Detailed compilation parameters and codebase density indices.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-6 flex-1 overflow-hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Usage density meter */}
                <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Stack Usage Density
                  </div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-black">{selectedDetails.usage}%</span>
                    <span className="text-xs text-muted-foreground">coverage</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary/35 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-[linear-gradient(90deg,#7C5CFF,#00D4FF)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedDetails.usage}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                {/* File Count diagnostics */}
                <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-4 w-4 text-[#00FFC6]" />
                    Associated Files
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
