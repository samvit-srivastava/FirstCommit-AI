"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Info,
  FileCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import type { FolderItem } from "@/types";
import { soundManager } from "@/lib/sounds";

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Typing animation ───────────────────────────────────────────────────────

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    // Reset on text change then start typing
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) clearInterval(interval);
    }, 8);
    return () => {
      clearInterval(interval);
      setDisplayed("");
    };
  }, [text]);

  return (
    <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-sans">
      {displayed}
    </p>
  );
}

// ─── Tree Node ──────────────────────────────────────────────────────────────

function TreeNode({
  item,
  depth,
  selectedPath,
  onSelect,
}: {
  item: FolderItem;
  depth: number;
  selectedPath: string;
  onSelect: (item: FolderItem) => void;
}) {
  const hasChildren = (item.children ?? []).length > 0;
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const isSelected = selectedPath === item.path;

  return (
    <div className="select-none font-mono">
      <div
        onClick={() => {
          soundManager.playClick();
          onSelect(item);
          if (hasChildren) setIsExpanded((e) => !e);
        }}
        onMouseEnter={() => soundManager.playHover()}
        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-all duration-150 cursor-pointer ${
          isSelected
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "hover:bg-white/[0.02] text-muted-foreground/70 hover:text-foreground border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <span className="shrink-0 text-muted-foreground/40">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            <span className="w-3 h-3 block" />
          )}
        </span>
        <span className="shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 text-primary/70" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-primary/50" />
            )
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground/30" />
          )}
        </span>
        <span className="truncate flex-1 group-hover:text-foreground transition-colors">{item.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-l border-white/5 ml-3"
          >
            {item.children!.map((child) => (
              <TreeNode
                key={child.path}
                item={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main View ──────────────────────────────────────────────────────────────

export function FolderExplorerView() {
  const { data } = useAnalysisData();
  const { folders } = data;

  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(
    folders.length > 0 ? folders[0] : null
  );

  // Keep selection in sync when data changes
  const currentPathsKey = folders.map((f) => f.path).join(",");
  const [lastPathsKey, setLastPathsKey] = useState(currentPathsKey);
  if (currentPathsKey !== lastPathsKey) {
    setLastPathsKey(currentPathsKey);
    if (!selectedFolder || !folders.some((f) => f.path === selectedFolder.path)) {
      setSelectedFolder(folders.length > 0 ? folders[0] : null);
    }
  }

  if (folders.length === 0 || !selectedFolder) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No folders detected. Please verify repository contents.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
          Knowledge Mapping
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          AI-analyzed folder structure and architectural explanations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 items-start">
        {/* Left: Directory tree */}
        <Card className="glass border-white/5 bg-[#050816]/20 md:col-span-2 h-[480px] flex flex-col overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <CardTitle className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground">
              Workspace Directories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-0.5 py-1">
                {folders.map((folder) => (
                  <TreeNode
                    key={folder.path}
                    item={folder}
                    depth={0}
                    selectedPath={selectedFolder.path}
                    onSelect={setSelectedFolder}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: AI explanation panel */}
        <Card className="glass border-white/5 bg-[#050816]/10 md:col-span-3 h-[480px] flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

          <CardHeader className="p-5 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 truncate max-w-[65%]">
                {selectedFolder.path}
              </span>
            </div>
            <CardTitle className="text-lg font-heading font-black text-foreground mt-3 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#00FFC6]" />
              {selectedFolder.name}
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              {/* AI Explanation */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  AI Analysis
                </h4>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <TypingText text={selectedFolder.explanation || "No explanation available for this folder."} />
                </div>
              </div>

              {/* Children list */}
              {selectedFolder.children && selectedFolder.children.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground/60">
                    Sub-Directories
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFolder.children.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedFolder(child);
                        }}
                        className="text-[11px] font-mono bg-white/[0.02] text-foreground/70 hover:text-foreground px-2.5 py-1 rounded-md border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-150 cursor-pointer"
                      >
                        {child.name}/
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center gap-2 text-[10px] text-muted-foreground/50">
            <Info className="h-3.5 w-3.5 text-primary/50 shrink-0" />
            <span>Select folders in the tree to view AI-generated architectural explanations.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
