"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Cpu,
  Search,
  Layers,
  Code2,
  FileCode,
  Folder,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/lib/AnalysisContext";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  location: string;
  language?: string;
  importance_score?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  file_path?: string;
  language?: string;
  line_number?: number;
}

interface RepositoryBrain {
  languages: string[];
  frameworks: string[];
  entry_points: string[];
  largest_folder: string;
  top_symbols: string[];
  most_imported_module: string;
}

interface GraphData {
  repository: string;
  generated_at: string;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    adjacency_map: Record<string, string[]>;
  };
  brain: RepositoryBrain;
}

export function GraphExplorerView() {
  const { repoUrl, analysisResult, selectedNodeId, setSelectedNodeId } = useAnalysis();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "calls" | "imports" | "components" | "routes" | "neighbors">("overview");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || (e.ctrlKey && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Effect to handle navigation from other views (auto select/scroll)
  useEffect(() => {
    if (selectedNodeId && data?.graph.nodes) {
      const node = data.graph.nodes.find((n) => n.id === selectedNodeId || n.name === selectedNodeId);
      if (node) {
        setSelectedNode(node);
        setSelectedNodeId(""); // Clear
        setTimeout(() => {
          const element = document.getElementById(`node-card-${node.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "animate-pulse");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "animate-pulse");
            }, 3000);
          }
        }, 300);
      }
    }
  }, [selectedNodeId, data, setSelectedNodeId]);

  // Effect to automatically switch activeTab based on node type
  useEffect(() => {
    if (!selectedNode) return;
    


    const nodeType = selectedNode.type.toLowerCase();
    if (nodeType === "file") {
      setActiveTab("imports");
    } else if (nodeType === "function" || nodeType === "class") {
      setActiveTab("calls");
    } else if (nodeType === "component" || nodeType === "hook") {
      setActiveTab("components");
    } else if (nodeType === "route") {
      setActiveTab("routes");
    } else {
      setActiveTab("overview");
    }
  }, [selectedNode]);

  // Expandable relationship group states
  const [outgoingExpanded, setOutgoingExpanded] = useState(true);
  const [incomingExpanded, setIncomingExpanded] = useState(true);

  useEffect(() => {
    if (!repoUrl) {
      setLoading(false);
      return;
    }

    const fetchGraph = async () => {
      try {
        setLoading(true);
        setError("");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/graph?repo_url=${encodeURIComponent(repoUrl)}`);
        if (!res.ok) {
          throw new Error("Failed to load repository relationships graph.");
        }
        const json = await res.json();
        setData(json);
        if (json.graph?.nodes?.length > 0) {
          setSelectedNode(json.graph.nodes[0]);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [repoUrl]);

  if (!repoUrl || !analysisResult) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No active repository details found. Please analyze a repository.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Network className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">Constructing unified codebase relationship graph...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500 text-sm">
        {error || "Failed to load graph metrics."}
      </div>
    );
  }

  const { brain, graph } = data;

  // Filter nodes
  const filteredNodes = graph.nodes.filter((node) => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || node.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Sort nodes by importance score (highest first)
  const sortedNodes = [...filteredNodes].sort(
    (a, b) => (b.importance_score || 0) - (a.importance_score || 0)
  );

  // Find all symbols defined or exported by the selected node if it's a File
  const fileSymbolIds = selectedNode && selectedNode.type === "File"
    ? graph.edges.filter(e => e.source === selectedNode.id && (e.relation === "defines" || e.relation === "exports")).map(e => e.target)
    : [];

  // Find parent file of selected node if it's a Symbol
  const parentFileEdge = selectedNode
    ? graph.edges.find(e => e.target === selectedNode.id && (e.relation === "defines" || e.relation === "exports"))
    : null;
  const parentFileId = parentFileEdge?.source;

  const activeNeighbors = selectedNode ? graph.adjacency_map[selectedNode.id] || [] : [];
  const selectedNodeEdges = selectedNode
    ? graph.edges.filter((e) => 
        e.source === selectedNode.id || 
        e.target === selectedNode.id ||
        (selectedNode.type === "File" && (fileSymbolIds.includes(e.source) || fileSymbolIds.includes(e.target))) ||
        (parentFileId && (e.source === parentFileId || e.target === parentFileId))
      )
    : [];

  // Calculate Graph Summary Counts
  const filesCount = graph.nodes.filter(n => n.type === "File").length;
  const functionsCount = graph.nodes.filter(n => n.type === "Function").length;
  const classesCount = graph.nodes.filter(n => n.type === "Class").length;
  const componentsCount = graph.nodes.filter(n => n.type === "Component").length;
  const routesCount = graph.nodes.filter(n => n.type === "Route").length;
  
  const callsCount = graph.edges.filter(e => e.relation === "calls").length;
  const importsCount = graph.edges.filter(e => e.relation === "imports").length;
  const rendersCount = graph.edges.filter(e => e.relation === "renders").length;

  const getRelationBadge = (relation: string) => {
    const colors = {
      calls: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      renders: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      handled_by: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      imports: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      contains: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      belongs_to: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };
    const label = relation === "handled_by" ? "HANDLED_BY" : relation.toUpperCase();
    return (
      <Badge variant="outline" className={`text-[8px] tracking-wider font-mono font-bold px-1.5 py-0 ${colors[relation as keyof typeof colors] || "bg-secondary text-muted-foreground border-border/20"}`}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Network className="h-7 w-7 text-primary" />
            <span>Graph Explorer & Repository Brain</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Explore deterministic codebase call graphs, routing systems, component trees, and imports mapping.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs px-2 py-0.5 border-primary/20 bg-primary/5 text-primary select-all">
          HEAD SHA: Verified
        </Badge>
      </div>

      {/* 0. Graph Summary Statistics */}
      <Card className="glass border-border/40 overflow-hidden">
        <CardContent className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { label: "Files", value: filesCount },
            { label: "Functions", value: functionsCount },
            { label: "Classes", value: classesCount },
            { label: "Components", value: componentsCount },
            { label: "Routes", value: routesCount },
            { label: "Calls", value: callsCount },
            { label: "Imports", value: importsCount },
            { label: "Renders", value: rendersCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-secondary/15 border border-border/30 rounded-xl p-3 text-center transition-all duration-300 hover:bg-secondary/25 hover:border-primary/20 hover:shadow-[0_0_15px_rgba(124,92,255,0.05)]"
            >
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/80 font-bold block">
                {stat.label}
              </span>
              <span className="text-lg font-black text-foreground mt-1 block">
                {stat.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 1. Repository Brain Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glass border-border/40">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Globe className="h-4 w-4" /> Entry Points & Frameworks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-3">
            <div>
              <span className="font-semibold block text-foreground mb-1">Detected Frameworks:</span>
              <div className="flex flex-wrap gap-1">
                {brain.frameworks.length > 0 ? (
                  brain.frameworks.map((f) => <Badge key={f} variant="secondary">{f}</Badge>)
                ) : (
                  <span className="italic">None detected</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-semibold block text-foreground mb-1">Key Entry Points:</span>
              <div className="font-mono text-[10px] space-y-0.5">
                {brain.entry_points.length > 0 ? (
                  brain.entry_points.map((ep) => <div key={ep}>• {ep}</div>)
                ) : (
                  <span className="italic text-muted-foreground">No standard files found</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Layers className="h-4 w-4" /> Layout Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-3">
            <div>
              <span className="font-semibold text-foreground">Largest Directory:</span>
              <div className="font-mono text-[11px] text-foreground mt-0.5 select-all">{brain.largest_folder}</div>
            </div>
            <div>
              <span className="font-semibold text-foreground">Most Imported Module:</span>
              <div className="font-mono text-[11px] text-foreground mt-0.5 select-all">{brain.most_imported_module}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Cpu className="h-4 w-4" /> Top architectural Symbols
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            <div className="space-y-1.5 mt-1 font-mono text-[10px]">
              {brain.top_symbols.map((sym, index) => (
                <div key={sym} className="flex justify-between items-center bg-secondary/35 p-1.5 rounded border border-border/10">
                  <span>{index + 1}. {sym}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/20 text-primary">Architectural</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Interactive Graph Layout */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Nodes search and list (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="glass border-border/40 flex flex-col h-[580px]">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Codebase Nodes ({sortedNodes.length})</CardTitle>
            </CardHeader>
            <div className="px-4 space-y-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search symbols, files, routes... (Press / to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/40 text-xs rounded-lg pl-8 pr-3 py-2 border border-border/40 focus:outline-none focus:border-primary/50 text-foreground font-mono"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1">
                {["all", "file", "folder", "class", "function", "component", "route"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-0.5 text-[9px] rounded font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filterType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {sortedNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                
                // Color mapping for node type badges
                const typeColors = node.type === "Component"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : node.type === "Function"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : node.type === "Route"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : node.type === "File"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : node.type === "Class"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : node.type === "Folder"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-secondary text-muted-foreground border-border/20";

                return (
                  <button
                    key={node.id}
                    id={`node-card-${node.id}`}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-sm shadow-primary/5"
                        : "bg-secondary/20 border-border/40 hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {node.type === "File" && <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                      {node.type === "Folder" && <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      {node.type === "Route" && <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      {!["File", "Folder", "Route"].includes(node.type) && <Code2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                      <span className={`text-xs truncate font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                        {node.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-[8px] font-semibold tracking-wide px-1 py-0 capitalize ${typeColors}`}>
                        {node.type}
                      </Badge>
                      {node.importance_score !== undefined && (
                        <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                          Score: {node.importance_score}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {sortedNodes.length === 0 && (
                <div className="text-center py-12 text-xs text-muted-foreground">No matching graph nodes found.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Node relationships details - Persistent scrolling / Sticky (Col 8) */}
        <div className="lg:col-span-8 sticky top-6">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <Card className="glass border-border/40 h-[560px] flex flex-col justify-between overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="h-4.5 w-4.5 text-primary" />
                        <CardTitle className="text-base font-bold text-foreground truncate">{selectedNode.name}</CardTitle>
                      </div>
                      <Badge className="text-xs uppercase tracking-wide">{selectedNode.type}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate mt-1">
                      UUID: {selectedNode.id}
                    </div>
                  </CardHeader>

                  {/* Inspector Tabs Navigation */}
                  <div className="flex bg-secondary/35 border-b border-border/30 px-2 py-1 gap-1 overflow-x-auto">
                    {(["overview", "calls", "imports", "components", "routes", "neighbors"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 text-[10px] font-semibold rounded uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                          activeTab === tab
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-foreground block">Code Location / Symbol Range</span>
                          <div className="bg-secondary/40 font-mono text-[10px] p-2.5 rounded text-foreground select-all">
                            {selectedNode.location || "Root workspace directory"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block">Architectural Meta</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-secondary/25 p-2 rounded">
                              <span className="text-muted-foreground text-[10px] block">Importance Score</span>
                              <span className="font-bold text-foreground">{selectedNode.importance_score ?? "1.0"}</span>
                            </div>
                            <div className="bg-secondary/25 p-2 rounded">
                              <span className="text-muted-foreground text-[10px] block">Language</span>
                              <span className="font-bold text-foreground">{selectedNode.language ?? "Universal"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "calls" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <button 
                            onClick={() => setOutgoingExpanded(!outgoingExpanded)}
                            className="text-xs font-semibold text-foreground flex items-center justify-between w-full border-b border-border/20 pb-1 cursor-pointer"
                          >
                            <span>Calls Functions (Out-degree)</span>
                            <span className="text-[10px] text-muted-foreground">
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).length} calls
                            </span>
                          </button>
                          
                          {outgoingExpanded && (
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).map((edge) => {
                                const tgt = graph.nodes.find((n) => n.id === edge.target);
                                if (!tgt) return null;
                                return (
                                  <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                    <span className="font-medium text-foreground">
                                      calls <button onClick={() => setSelectedNode(tgt)} className="text-primary hover:underline font-bold text-left cursor-pointer">{tgt.name}</button>
                                    </span>
                                    {getRelationBadge(edge.relation)}
                                  </div>
                                );
                              })}
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).length === 0 && (
                                <div className="text-[10px] italic text-muted-foreground/60">No outgoing function calls.</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <button 
                            onClick={() => setIncomingExpanded(!incomingExpanded)}
                            className="text-xs font-semibold text-foreground flex items-center justify-between w-full border-b border-border/20 pb-1 cursor-pointer"
                          >
                            <span>Called By (In-degree)</span>
                            <span className="text-[10px] text-muted-foreground">
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).length} callers
                            </span>
                          </button>

                          {incomingExpanded && (
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).map((edge) => {
                                const src = graph.nodes.find((n) => n.id === edge.source);
                                if (!src) return null;
                                return (
                                  <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                    <span className="font-medium text-foreground">
                                      called by <button onClick={() => setSelectedNode(src)} className="text-primary hover:underline font-bold text-left cursor-pointer">{src.name}</button>
                                    </span>
                                    {getRelationBadge(edge.relation)}
                                  </div>
                                );
                              })}
                              {selectedNodeEdges.filter(e => e.relation === "calls" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).length === 0 && (
                                <div className="text-[10px] italic text-muted-foreground/60">Never called by any mapped functions.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "imports" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Imports Modules
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "imports" && (e.source === selectedNode.id || parentFileId === e.source)).map((edge) => {
                              const tgt = graph.nodes.find((n) => n.id === edge.target);
                              if (!tgt) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    imports <button onClick={() => setSelectedNode(tgt)} className="text-primary hover:underline font-bold text-left cursor-pointer">{tgt.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "imports" && (e.source === selectedNode.id || parentFileId === e.source)).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">No imported modules.</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Imported By
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "imports" && (e.target === selectedNode.id || parentFileId === e.target)).map((edge) => {
                              const src = graph.nodes.find((n) => n.id === edge.source);
                              if (!src) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    imported by <button onClick={() => setSelectedNode(src)} className="text-primary hover:underline font-bold text-left cursor-pointer">{src.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "imports" && (e.target === selectedNode.id || parentFileId === e.target)).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">Never imported.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "components" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Renders Components
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "renders" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).map((edge) => {
                              const tgt = graph.nodes.find((n) => n.id === edge.target);
                              if (!tgt) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    renders <button onClick={() => setSelectedNode(tgt)} className="text-primary hover:underline font-bold text-left cursor-pointer">{tgt.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "renders" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">Does not render components.</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Rendered By
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "renders" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).map((edge) => {
                              const src = graph.nodes.find((n) => n.id === edge.source);
                              if (!src) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    rendered by <button onClick={() => setSelectedNode(src)} className="text-primary hover:underline font-bold text-left cursor-pointer">{src.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "renders" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">Not rendered in JSX tree.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "routes" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Routes Handled
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "handled_by" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).map((edge) => {
                              const tgt = graph.nodes.find((n) => n.id === edge.target);
                              if (!tgt) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    routes to <button onClick={() => setSelectedNode(tgt)} className="text-primary hover:underline font-bold text-left cursor-pointer">{tgt.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "handled_by" && (e.source === selectedNode.id || fileSymbolIds.includes(e.source))).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">Does not map to route handlers.</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                            Route Handlers Mapping
                          </span>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {selectedNodeEdges.filter(e => e.relation === "handled_by" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).map((edge) => {
                              const src = graph.nodes.find((n) => n.id === edge.source);
                              if (!src) return null;
                              return (
                                <div key={edge.id} className="flex justify-between items-center bg-secondary/25 p-2 rounded border border-border/20 text-[10px]">
                                  <span className="font-medium text-foreground">
                                    handler for <button onClick={() => setSelectedNode(src)} className="text-primary hover:underline font-bold text-left cursor-pointer">{src.name}</button>
                                  </span>
                                  {getRelationBadge(edge.relation)}
                                </div>
                              );
                            })}
                            {selectedNodeEdges.filter(e => e.relation === "handled_by" && (e.target === selectedNode.id || fileSymbolIds.includes(e.target))).length === 0 && (
                              <div className="text-[10px] italic text-muted-foreground/60">No route mapping to this handler.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "neighbors" && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground block border-b border-border/20 pb-1">
                          Direct Adjacency Neighbors ({activeNeighbors.length})
                        </span>
                        <div className="grid gap-2 sm:grid-cols-2 max-h-[220px] overflow-y-auto">
                          {activeNeighbors.map((nbId) => {
                            const neighborNode = graph.nodes.find((n) => n.id === nbId);
                            if (!neighborNode) return null;
                            return (
                              <button
                                key={nbId}
                                onClick={() => setSelectedNode(neighborNode)}
                                className="text-left p-2 rounded bg-secondary/35 border border-border/20 text-[10px] truncate hover:bg-secondary/65 transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span className="truncate">{neighborNode.name}</span>
                                <Badge variant="outline" className="text-[8px] scale-90 px-1 py-0">{neighborNode.type}</Badge>
                              </button>
                            );
                          })}
                          {activeNeighbors.length === 0 && (
                            <div className="text-[10px] italic text-muted-foreground col-span-2">No adjacent nodes in neighborhood.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="flex h-[560px] items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs bg-white/[0.01]">
                Select a graph node to explore its codebase call connections and metadata details.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
