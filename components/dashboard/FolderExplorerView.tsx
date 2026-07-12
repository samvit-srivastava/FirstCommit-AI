"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FolderOpen, ChevronRight, ChevronDown, Info, HelpCircle, Terminal, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import type { FolderItem } from "@/types";
import { soundManager } from "@/lib/sounds";

// Helper to simulate mock file counts for aesthetics
const MOCK_FILE_COUNTS: Record<string, { files: number; size: string; flow: string[] }> = {
  packages: { files: 124, size: "14.2 MB", flow: ["Monorepo Node", "Sub-package Layer", "Compile Targets"] },
  app: { files: 45, size: "5.4 MB", flow: ["Layouts File", "Dynamic Page Routes", "React View Components"] },
  components: { files: 98, size: "11.1 MB", flow: ["Atomic design elements", "Reusable UI Shells", "Tailwind styling overrides"] },
  lib: { files: 14, size: "1.9 MB", flow: ["Utility helper files", "API fetch functions", "Context Providers"] },
  public: { files: 12, size: "1.2 MB", flow: ["Static Asset Files", "Images & SVGs", "Client side downloads"] },
  test: { files: 256, size: "16.1 MB", flow: ["Unit tests runner", "Playwright workspace", "E2E testing cases"] },
};

function TypingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [lastText, setLastText] = useState(text);

  if (text !== lastText) {
    setLastText(text);
    setDisplayedText("");
  }

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(idx));
      idx++;
      if (idx >= text.length) {
        clearInterval(interval);
      }
    }, 10); // Speed up typing
    return () => clearInterval(interval);
  }, [text]);

  return <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-mono">{displayedText}</p>;
}

export function FolderExplorerView() {
  const { data } = useAnalysisData();
  const { folders } = data;
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(() => {
    return folders.length > 0 ? folders[0] : null;
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "packages/": true,
    "app/": true,
  });

  // Keep selected folder in sync if the folders array changes
  const currentFoldersPathStr = folders.map((f) => f.path).join(",");
  const [lastFoldersPathStr, setLastFoldersPathStr] = useState(currentFoldersPathStr);

  if (currentFoldersPathStr !== lastFoldersPathStr) {
    setLastFoldersPathStr(currentFoldersPathStr);
    if (!selectedFolder || !folders.some((f) => f.path === selectedFolder.path)) {
      setSelectedFolder(folders.length > 0 ? folders[0] : null);
    }
  }

  if (folders.length === 0 || !selectedFolder) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No folders detected. Please verify repository contents.
      </div>
    );
  }

  const toggleExpand = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getStats = (path: string) => {
    const key = path.endsWith("/") ? path.slice(0, -1) : path;
    const name = key.split("/").pop() ?? "";
    return MOCK_FILE_COUNTS[name] ?? { 
      files: 8, 
      size: "128 KB",
      flow: ["Local Directory File", "Code configuration logic", "Diagnostic indexes"]
    };
  };

  // Recursive Tree Node renderer
  const renderTree = (item: FolderItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !!expandedFolders[item.path];
    const isSelected = selectedFolder.path === item.path;
    const stats = getStats(item.path);

    return (
      <div key={item.path} className="select-none font-mono">
        <div
          onClick={(e) => {
            e.stopPropagation();
            soundManager.playClick();
            setSelectedFolder(item);
            if (hasChildren) toggleExpand(item.path);
          }}
          onMouseEnter={() => soundManager.playHover()}
          className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 cursor-pointer ${
            isSelected
              ? "bg-primary/10 text-primary border-l border-primary"
              : "hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
          style={{ paddingLeft: `${Math.max(10, depth * 16)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-muted-foreground/60 transition-transform duration-200">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              ) : (
                <span className="w-3 h-3 block" />
              )}
            </span>

            <span className="shrink-0 text-primary/80">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5" />
                ) : (
                  <Folder className="h-3.5 w-3.5" />
                )
              ) : (
                <Folder className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </span>

            <span className="truncate text-foreground/90 group-hover:text-foreground">
              {item.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-2 opacity-50 group-hover:opacity-100">
            <span className="text-[9px] text-muted-foreground/80 font-mono">
              {stats.files} files
            </span>
          </div>
        </div>

        {/* Nested folders */}
        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-l border-border/20 ml-3 pl-1"
            >
              {item.children?.map((child) => renderTree(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const selectedStats = getStats(selectedFolder.path);

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
          Knowledge Mapping
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tactical file-tree explorer mapping folder architectural roles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 items-start">
        {/* Left Side: VS Code style Explorer */}
        <Card className="glass bg-[#050816]/75 border-border/40 md:col-span-2 h-[480px] flex flex-col relative overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/20 flex flex-row items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <CardTitle className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground">
              Workspace Directories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-1 py-1">
                {folders.map((folder) => renderTree(folder))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Side: AI Explanations */}
        <Card className="glass border-border/40 md:col-span-3 h-[480px] flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex-1 flex flex-col">
            <CardHeader className="p-5 pb-3 border-b border-border/20">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 truncate max-w-[70%]">
                  {selectedFolder.path}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded shrink-0">
                  {selectedStats.size}
                </span>
              </div>
              <CardTitle className="text-lg font-heading font-black text-foreground mt-3 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#00FFC6]" />
                {selectedFolder.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Contains {selectedStats.files} source files and configurations.
              </CardDescription>
            </CardHeader>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                
                {/* AI Explanation with typing effect */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    AI Purpose Mapping
                  </h4>
                  <div className="p-4 bg-secondary/15 rounded-xl border border-border/30">
                    <TypingText text={selectedFolder.explanation} />
                  </div>
                </div>

                {/* Dynamic mini-architecture map */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-heading font-bold text-[#00FFC6] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    Interactive Directory Flow Architecture
                  </h4>
                  <div className="flex items-center gap-2.5 overflow-x-auto py-2">
                    {selectedStats.flow.map((node, idx) => (
                      <div key={node} className="flex items-center gap-2 shrink-0">
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-card/60 font-mono text-[10px] text-foreground font-bold">
                          {node}
                        </div>
                        {idx < selectedStats.flow.length - 1 && (
                          <span className="text-muted-foreground/40 font-mono text-xs">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </ScrollArea>
          </div>

          {/* Footer prompt */}
          <div className="p-4 border-t border-border/20 bg-secondary/15 flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Select directories in the tree on the left to learn about their structure role.</span>
          </div>
        </Card>
      </div>

    </div>
  );
}
