"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FolderOpen, ChevronRight, ChevronDown, FolderTree, Info, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockAnalysis } from "@/lib/mock-data";
import type { FolderItem } from "@/types";

// Helper to simulate mock file counts for aesthetics
const MOCK_FILE_COUNTS: Record<string, { files: number; size: string }> = {
  packages: { files: 124, size: "14.2 MB" },
  next: { files: 98, size: "11.1 MB" },
  "create-next-app": { files: 12, size: "1.2 MB" },
  font: { files: 14, size: "1.9 MB" },
  apps: { files: 45, size: "5.4 MB" },
  docs: { files: 198, size: "8.2 MB" },
  examples: { files: 432, size: "28.5 MB" },
  test: { files: 256, size: "16.1 MB" },
  e2e: { files: 110, size: "7.8 MB" },
  integration: { files: 146, size: "8.3 MB" },
  turbopack: { files: 312, size: "48.2 MB" },
};

export function FolderExplorerView() {
  const { folders } = mockAnalysis;
  const [selectedFolder, setSelectedFolder] = useState<FolderItem>(folders[0]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "packages/": true,
    "test/": true,
  });

  const toggleExpand = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getStats = (path: string) => {
    // Clean trailing slash for matching stats
    const key = path.endsWith("/") ? path.slice(0, -1) : path;
    const name = key.split("/").pop() ?? "";
    return MOCK_FILE_COUNTS[name] ?? { files: 8, size: "128 KB" };
  };

  // Recursive Tree Node renderer
  const renderTree = (item: FolderItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !!expandedFolders[item.path];
    const isSelected = selectedFolder.path === item.path;
    const stats = getStats(item.path);

    return (
      <div key={item.path} className="select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFolder(item);
            if (hasChildren) toggleExpand(item.path);
          }}
          className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all duration-150 cursor-pointer ${
            isSelected
              ? "bg-primary/10 text-primary border-l-2 border-primary"
              : "hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
          style={{ paddingLeft: `${Math.max(10, depth * 20)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-muted-foreground/60 transition-transform duration-200">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )
              ) : (
                <span className="w-3.5 h-3.5 block" />
              )}
            </span>

            <span className="shrink-0 text-primary/80 group-hover:text-primary">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground/50" />
              )}
            </span>

            <span className="font-medium truncate text-foreground/90 group-hover:text-foreground">
              {item.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-2">
            <span className="text-[10px] text-muted-foreground/50 font-mono group-hover:text-muted-foreground/80">
              {stats.files} items
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
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-l border-border/20 ml-4 pl-1"
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Folder Explorer
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Browse the project layout to understand the purpose of primary folders without viewing code files.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 items-start">
        {/* Left Side Folder Tree */}
        <Card className="glass border-border/40 md:col-span-2 h-[480px] flex flex-col">
          <CardHeader className="p-4 pb-2 border-b border-border/20 flex flex-row items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Repository Tree
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

        {/* Right Side Folder Explanation */}
        <Card className="glass border-border/40 md:col-span-3 h-[480px] flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex-1 flex flex-col">
            <CardHeader className="p-5 pb-3 border-b border-border/20">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 truncate max-w-[70%]">
                  {selectedFolder.path}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded shrink-0">
                  {selectedStats.size}
                </span>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-3 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {selectedFolder.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Contains {selectedStats.files} source files and configurations.
              </CardDescription>
            </CardHeader>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    AI Purpose Mapping
                  </h4>
                  <p className="text-sm sm:text-base leading-relaxed text-foreground/90 bg-secondary/20 p-4 rounded-xl border border-border/20">
                    {selectedFolder.explanation}
                  </p>
                </div>

                {selectedFolder.children && selectedFolder.children.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5" />
                      Subfolders inside {selectedFolder.name}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedFolder.children.map((sub) => (
                        <div
                          key={sub.path}
                          onClick={() => setSelectedFolder(sub)}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-border/20 bg-secondary/10 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                        >
                          <Folder className="h-4 w-4 text-primary/80 shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">
                            {sub.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Prompt footer */}
          <div className="p-4 border-t border-border/20 bg-secondary/15 flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Select folders in the tree on the left to learn about their structure and architecture role.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
