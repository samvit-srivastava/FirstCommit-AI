"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FolderTree, 
  Info, 
  HelpCircle,
  Layout,
  Server,
  Hammer,
  FileText,
  CheckSquare,
  Image,
  FileCode
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysis } from "@/lib/AnalysisContext";

export interface RichFolderItem {
  name: string;
  path: string;
  category: string;
  description: string;
  contains: string[];
  importance: string;
  confidence: number;
  source: string;
  provider: string | null;
  model: string | null;
  files_count: number;
  size_bytes: number;
  children?: RichFolderItem[];
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  Frontend: { label: "Frontend", icon: Layout, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  Backend: { label: "Backend", icon: Server, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  Infrastructure: { label: "Infrastructure", icon: Hammer, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  Documentation: { label: "Documentation", icon: FileText, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  Testing: { label: "Testing", icon: CheckSquare, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  Assets: { label: "Assets", icon: Image, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  Mobile: { label: "Mobile", icon: Image, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  Unknown: { label: "Project Specific", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
};

const IMPORTANCE_COLOR: Record<string, string> = {
  High: "text-red-500 bg-red-500/10 border-red-500/20",
  Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

const SOURCE_META: Record<string, { label: string; color: string }> = {
  template: { label: "Standard Template", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  llm: { label: "Project Specific", color: "text-primary bg-primary/10 border-primary/20" },
  fallback: { label: "Fallback", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
};

export function FolderExplorerView() {
  const { analysisResult } = useAnalysis();
  const [selectedFolder, setSelectedFolder] = useState<RichFolderItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const folders: RichFolderItem[] = (analysisResult?.folders || []).map((item) => ({
    name: item.name,
    path: item.name + "/",
    category: item.category,
    description: item.description,
    contains: item.contains || [],
    importance: item.importance,
    confidence: item.confidence,
    source: item.source,
    provider: item.provider,
    model: item.model,
    files_count: item.files_count,
    size_bytes: item.size_bytes,
    children: []
  }));

  // Fallback to legacy format if folders array is empty but folder_explanation exists
  if (folders.length === 0 && analysisResult?.folder_explanation) {
    analysisResult.folder_explanation.forEach((item) => {
      const cleanName = item.path.replace(/\/$/, "");
      folders.push({
        name: cleanName,
        path: item.path,
        category: "Unknown",
        description: item.purpose,
        contains: [],
        importance: "Medium",
        confidence: 100,
        source: "template",
        provider: null,
        model: null,
        files_count: 0,
        size_bytes: 0,
        children: []
      });
    });
  }

  useEffect(() => {
    if (folders && folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0]);
    }
  }, [analysisResult, folders, selectedFolder]);

  if (!analysisResult || folders.length === 0 || !selectedFolder) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No active repository details found. Please analyze a repository.
      </div>
    );
  }

  const toggleExpand = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k)) ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Recursive Tree Node renderer
  const renderTree = (item: RichFolderItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !!expandedFolders[item.path];
    const isSelected = selectedFolder.path === item.path;

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
              {item.files_count} files
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
        <Card className="glass border-border/40 md:col-span-2 h-[520px] flex flex-col">
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
        <Card className="glass border-border/40 md:col-span-3 h-[520px] flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex-1 flex flex-col">
            <CardHeader className="p-5 pb-3 border-b border-border/20">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 truncate max-w-[70%]">
                  {selectedFolder.path}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded shrink-0">
                  {formatBytes(selectedFolder.size_bytes)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {selectedFolder.name}
                </CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Importance Badge */}
                  {selectedFolder.importance && (
                    <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0 ${IMPORTANCE_COLOR[selectedFolder.importance] || IMPORTANCE_COLOR.Low}`}>
                      {selectedFolder.importance} Priority
                    </Badge>
                  )}
                  {/* Category Badge */}
                  {selectedFolder.category && (() => {
                    const catMeta = CATEGORY_META[selectedFolder.category] || CATEGORY_META.Unknown;
                    const IconComponent = catMeta.icon;
                    return (
                      <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0 flex items-center gap-1 ${catMeta.color}`}>
                        <IconComponent className="h-3 w-3" />
                        {catMeta.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Contains {selectedFolder.files_count} files in total.
              </CardDescription>
            </CardHeader>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Repository Knowledge Analysis
                    </h4>
                    {selectedFolder.source && (() => {
                      if (selectedFolder.source === "llm" && selectedFolder.provider && selectedFolder.model) {
                        return (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-primary bg-primary/10 border-primary/20">
                            {selectedFolder.provider} • {selectedFolder.model}
                          </span>
                        );
                      } else if (selectedFolder.source === "llm" && selectedFolder.model) {
                        return (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-primary bg-primary/10 border-primary/20">
                            {selectedFolder.model}
                          </span>
                        );
                      }
                      const srcMeta = SOURCE_META[selectedFolder.source] || SOURCE_META.template;
                      return (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${srcMeta.color}`}>
                          {srcMeta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 bg-secondary/20 p-4 rounded-xl border border-border/20">
                    {selectedFolder.description || "No description provided for this folder."}
                  </p>
                </div>

                {/* Real Repository Contents (Files) */}
                {selectedFolder.contains && selectedFolder.contains.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5" />
                      Repository Contents (Files)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFolder.contains.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono bg-secondary/50 text-foreground/80 px-2.5 py-1 rounded-md border border-border/40"
                        >
                          {tag}
                        </span>
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
            <span>Select folders in the tree on the left to learn about their structure and size metrics.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
