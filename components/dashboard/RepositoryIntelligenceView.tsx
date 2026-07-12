"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  Cpu,
  Globe,
  Code2,
  FileCode,
  Folder,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy,
  Loader2,
  Network,
  Terminal,
  HelpCircle,
  TrendingUp,
  History,
  GitPullRequest,
  CheckCircle,
} from "lucide-react";
import { useAnalysis } from "@/lib/AnalysisContext";
import { soundManager } from "@/lib/sounds";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface GraphData {
  repository: string;
  generated_at: string;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    adjacency_map: Record<string, string[]>;
  };
  brain: {
    languages: string[];
    frameworks: string[];
    entry_points: string[];
    largest_folder: string;
    top_symbols: string[];
    most_imported_module: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function RepositoryIntelligenceView() {
  const { repoUrl, setSelectedNodeId } = useAnalysis();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"locator" | "dependencies">("locator");
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab 1: Locator State
  const [locatorQuery, setLocatorQuery] = useState("");
  const [locatorResults, setLocatorResults] = useState<GraphNode[]>([]);
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const locatorInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Dependency Explorer State
  const [depSearchQuery, setDepSearchQuery] = useState("");
  const [selectedDepNode, setSelectedDepNode] = useState<GraphNode | null>(null);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);

  // 1. Fetch Graph Cache Data
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
          throw new Error("Failed to load repository graph data.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [repoUrl]);

  // Global search focus listener (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || (e.ctrlKey && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (activeTab !== "locator") {
          setActiveTab("locator");
        }
        setTimeout(() => {
          locatorInputRef.current?.focus();
        }, 100);
      }

      if (e.key === "Escape" && activeTab === "locator" && document.activeElement === locatorInputRef.current) {
        setLocatorQuery("");
        setLocatorResults([]);
        setIsFallbackResult(false);
        locatorInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Scrub Query fillers
  const cleanQuery = (query: string): string => {
    const fillers = ["where", "is", "the", "show", "find", "locate", "a", "an", "what", "how", "to", "of", "in", "by"];
    const words = query.toLowerCase().split(/\s+/);
    const meaningful = words.filter((w) => !fillers.includes(w));
    return meaningful.join(" ").trim();
  };

  // Fuzzy Search Resolver (Tab 1: Where is X?)
  const handleLocatorSearch = (queryStr: string) => {
    if (!data?.graph.nodes) return;
    const cleanSearch = cleanQuery(queryStr);
    if (!cleanSearch) {
      setLocatorResults([]);
      setIsFallbackResult(false);
      return;
    }

    soundManager.playClick();

    const scored = data.graph.nodes.map((node) => {
      let score = 0;
      const nameLower = node.name.toLowerCase();
      const locLower = node.location.toLowerCase();
      const typeLower = node.type.toLowerCase();

      // Exact match priorities
      const isExactSymbol = nameLower === cleanSearch && !["file", "folder", "route"].includes(typeLower);
      const isExactFile = nameLower === cleanSearch && typeLower === "file";
      const isExactRoute = nameLower === cleanSearch && typeLower === "route";

      if (isExactSymbol) {
        score += 15000;
      } else if (isExactFile) {
        score += 12000;
      } else if (isExactRoute) {
        score += 10000;
      }

      // Partial / Substring matches
      if (nameLower.startsWith(cleanSearch)) {
        score += 6000;
      } else if (nameLower.includes(cleanSearch)) {
        score += 3000;
      }
      if (locLower.includes(cleanSearch)) {
        score += 1500;
      }

      // Word matches
      const terms = cleanSearch.split(/\s+/);
      let matches = 0;
      terms.forEach((t) => {
        if (nameLower.includes(t) || locLower.includes(t)) {
          matches++;
        }
      });
      score += matches * 300;

      // Centrality & Importance weighting
      const degree = data.graph.adjacency_map[node.id]?.length || 0;
      score += (node.importance_score || 0) * 200;
      score += degree * 15;

      const hasMatch = matches > 0 || isExactSymbol || isExactFile || isExactRoute || nameLower.includes(cleanSearch);

      return { node, score, hasMatch };
    });

    const matches = scored.filter((item) => item.score > 250 && item.hasMatch);

    if (matches.length > 0) {
      const sortedMatches = matches.sort((a, b) => b.score - a.score).map((item) => item.node);
      setLocatorResults(sortedMatches.slice(0, 6));
      setIsFallbackResult(false);
    } else {
      // Fallback: take top 3 closest items in repository
      const sortedClosest = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.node);
      setLocatorResults(sortedClosest);
      setIsFallbackResult(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocatorQuery(suggestion);
    handleLocatorSearch(suggestion);
  };

  const handleOpenInGraph = (node: GraphNode) => {
    soundManager.playSuccess();
    setSelectedNodeId(node.id);
    addToRecentlyViewed(node.id);
    router.push("/dashboard/graph");
  };

  const addToRecentlyViewed = (nodeId: string) => {
    setRecentlyViewedIds((prev) => {
      const next = prev.filter((id) => id !== nodeId);
      return [nodeId, ...next].slice(0, 5);
    });
  };

  // Node Description Generator
  const getNodeDescription = (node: GraphNode): string => {
    const type = node.type.toLowerCase();
    if (type === "component") return "UI Component rendering display parameters.";
    if (type === "file") return "Source file containing structural definitions.";
    if (type === "route") return "Router endpoint mapping API server targets.";
    if (type === "function") return "Callable execution method helper.";
    if (type === "class") return "Construct class module structures.";
    if (type === "folder") return "Root segment dividing repository layouts.";
    return "Repository symbol parameter node.";
  };

  // Icon type mapping helper
  const getNodeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === "file") return FileCode;
    if (t === "component") return Code2;
    if (t === "route") return Globe;
    if (t === "folder") return Folder;
    if (t === "class") return Cpu;
    return Terminal;
  };

  // Badge theme coloring helper
  const getNodeBadgeStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t === "component") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (t === "route") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (t === "file") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    if (t === "class") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  // 1. Popular Nodes (Highest RKE Importance)
  const popularNodes = useMemo(() => {
    if (!data?.graph.nodes) return [];
    return [...data.graph.nodes]
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
      .slice(0, 4);
  }, [data]);

  // 2. Most Connected Nodes (Highest Centrality Degree)
  const mostConnectedNodes = useMemo(() => {
    if (!data?.graph.nodes) return [];
    return [...data.graph.nodes]
      .sort((a, b) => {
        const degA = data.graph.adjacency_map[a.id]?.length || 0;
        const degB = data.graph.adjacency_map[b.id]?.length || 0;
        return degB - degA;
      })
      .slice(0, 4);
  }, [data]);

  // 3. Recently Viewed Nodes
  const recentlyViewedNodes = useMemo(() => {
    if (!data?.graph.nodes) return [];
    return recentlyViewedIds
      .map((id) => data.graph.nodes.find((n) => n.id === id))
      .filter((n) => n !== undefined) as GraphNode[];
  }, [recentlyViewedIds, data]);

  // Dependency Explorer suggestions list
  const filteredNodesForDep = useMemo(() => {
    if (!data?.graph.nodes) return [];
    const query = depSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return data.graph.nodes
      .filter((n) => n.name.toLowerCase().includes(query) || n.location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [depSearchQuery, data]);

  // Incoming and Outgoing edge collections for selected dependency target
  const dependsOnList = useMemo(() => {
    if (!selectedDepNode || !data?.graph.edges) return [];
    return data.graph.edges
      .filter((e) => e.source === selectedDepNode.id && e.relation !== "CONTAINS" && e.relation !== "BELONGS_TO")
      .map((e) => {
        const targetNode = data.graph.nodes.find((n) => n.id === e.target);
        return { edge: e, node: targetNode };
      })
      .filter((item) => item.node !== undefined) as Array<{ edge: GraphEdge; node: GraphNode }>;
  }, [selectedDepNode, data]);

  const usedByList = useMemo(() => {
    if (!selectedDepNode || !data?.graph.edges) return [];
    return data.graph.edges
      .filter((e) => e.target === selectedDepNode.id && e.relation !== "CONTAINS" && e.relation !== "BELONGS_TO")
      .map((e) => {
        const sourceNode = data.graph.nodes.find((n) => n.id === e.source);
        return { edge: e, node: sourceNode };
      })
      .filter((item) => item.node !== undefined) as Array<{ edge: GraphEdge; node: GraphNode }>;
  }, [selectedDepNode, data]);

  // Metrics mapping for selected node
  const selectedNodeMetrics = useMemo(() => {
    if (!selectedDepNode || !data) return null;
    const nodeId = selectedDepNode.id;
    const edges = data.graph.edges;

    const outgoing = edges.filter((e) => e.source === nodeId);
    const incoming = edges.filter((e) => e.target === nodeId);
    const totalRelations = outgoing.length + incoming.length;

    const importCount = edges.filter((e) => (e.source === nodeId || e.target === nodeId) && e.relation === "IMPORTS").length;
    const callCount = edges.filter((e) => (e.source === nodeId || e.target === nodeId) && e.relation === "CALLS").length;
    const renderCount = edges.filter((e) => (e.source === nodeId || e.target === nodeId) && e.relation === "RENDERS").length;

    return {
      importance: selectedDepNode.importance_score || 1.0,
      relations: totalRelations,
      imports: importCount,
      calls: callCount,
      renders: renderCount,
      centrality: data.graph.adjacency_map[nodeId]?.length || 0,
    };
  }, [selectedDepNode, data]);

  const handleCopyPath = async (path: string, nodeId: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedNodeId(nodeId);
      setTimeout(() => setCopiedNodeId(null), 2000);
      soundManager.playSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-mono">Resolving Intelligence Index Cache...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/35 bg-destructive/5 max-w-xl mx-auto mt-12">
        <CardHeader>
          <CardTitle className="text-destructive text-lg font-bold">Failed to load graph</CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 select-none">
      {/* 1. Header Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
          <Cpu className="h-7 w-7 text-primary" />
          Repository Intelligence
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-sans font-medium">
          Understand codebase structures, locate architectural components, and explore symbol dependencies.
        </p>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex relative space-x-2 shrink-0 bg-white/[0.02] border border-white/5 rounded-xl p-1.5 max-w-md">
        {[
          { id: "locator", label: "📍 Where is X?" },
          { id: "dependencies", label: "📊 Dependency Explorer" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id as any);
              }}
              className="flex-1 relative px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer text-center z-10 transition-colors duration-200"
            >
              <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-white" : "text-muted-foreground/60 hover:text-foreground"}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg shadow-[0_0_15px_rgba(124,92,255,0.15)]"
                  transition={{ type: "spring" as const, stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Views switcher */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* TAB 1: Locator */}
          {activeTab === "locator" && (
            <div className="space-y-6">
              <Card className="glass border-border/40 bg-white/[0.01]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Search className="h-4.5 w-4.5 text-primary" />
                    Natural Language locator
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed font-sans">
                    Search files, routes, classes, or UI components using semantic keyword patterns. Press{" "}
                    <code className="bg-secondary/40 px-1.5 py-0.5 rounded text-primary font-bold">/</code> to focus.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLocatorSearch(locatorQuery);
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                      <input
                        ref={locatorInputRef}
                        type="text"
                        placeholder="where is login / authentication / dashboard"
                        value={locatorQuery}
                        onChange={(e) => setLocatorQuery(e.target.value)}
                        className="w-full bg-secondary/40 text-sm rounded-xl pl-11 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 shadow-[0_0_15px_rgba(124,92,255,0.02)] focus:shadow-[0_0_20px_rgba(124,92,255,0.1)] text-foreground font-mono"
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:brightness-110 cursor-pointer font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-primary/25 transition-all active:scale-98">
                      Search
                    </Button>
                  </form>

                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground/45 uppercase tracking-widest font-black">
                      Quick Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "login",
                        "authentication",
                        "dashboard",
                        "graph explorer",
                        "parser",
                        "theme provider",
                      ].map((s) => (
                        <motion.button
                          key={s}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSuggestionClick(s)}
                          className="text-[10px] font-semibold bg-secondary/20 hover:bg-primary/10 border border-border/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-foreground/85 hover:text-primary font-mono"
                        >
                          where is {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-4">
                {isFallbackResult && locatorResults.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs font-mono">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>No exact match found. Showing closest repository suggestions:</span>
                  </div>
                )}

                {locatorResults.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {locatorResults.map((node) => {
                      const degree = data?.graph.adjacency_map[node.id]?.length || 0;
                      const IconComponent = getNodeIcon(node.type);

                      return (
                        <motion.div
                          key={node.id}
                          variants={itemVariants}
                          whileHover={{ y: -3, borderColor: "rgba(124,92,255,0.2)" }}
                          className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-sm"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate font-mono flex items-center gap-2">
                                <IconComponent className="h-4.5 w-4.5 text-muted-foreground/75" />
                                {node.name}
                              </span>
                              <Badge variant="outline" className={`text-[8px] font-semibold tracking-wide uppercase px-2 py-0.5 ${getNodeBadgeStyle(node.type)}`}>
                                {node.type}
                              </Badge>
                            </div>

                            <p className="text-[10px] font-mono text-muted-foreground/60 break-all select-text bg-white/[0.02] p-2 rounded-lg border border-white/5">
                              {node.location}
                            </p>

                            <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                              {getNodeDescription(node)}
                            </p>

                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-primary" /> Importance: {node.importance_score?.toFixed(1) || "1.0"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Network className="h-3 w-3 text-secondary" /> Relationships: {degree}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleCopyPath(node.location, node.id)}
                              className="text-[10px] text-muted-foreground hover:text-foreground font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedNodeId === node.id ? "Copied Path" : "Copy Path"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenInGraph(node)}
                              className="text-xs text-primary hover:text-[#00FFC6] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Open in Graph
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  locatorQuery.trim() !== "" && (
                    <div className="text-center py-10 text-muted-foreground text-xs font-mono bg-white/[0.01] border border-white/5 rounded-2xl">
                      No matching symbols found. Use general suggestion terms.
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Dependency Explorer */}
          {activeTab === "dependencies" && (
            <div className="space-y-6">
              {/* Autocomplete Input Search */}
              <Card className="glass border-border/40 bg-white/[0.01]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Dependency Target Search
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed font-sans">
                    Fuzzy search to select a codebase symbol and reveal its structural connection maps.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type a component name, file path, route..."
                      value={depSearchQuery}
                      onChange={(e) => setDepSearchQuery(e.target.value)}
                      className="w-full bg-secondary/40 text-sm rounded-xl pl-11 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 text-foreground font-mono"
                    />
                  </div>

                  {/* Dropdown Suggestions */}
                  {filteredNodesForDep.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-secondary/90 border border-border/30 rounded-xl overflow-hidden divide-y divide-white/5 shadow-2xl relative z-10"
                    >
                      {filteredNodesForDep.map((node) => {
                        const Icon = getNodeIcon(node.type);
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => {
                              setSelectedDepNode(node);
                              addToRecentlyViewed(node.id);
                              setDepSearchQuery("");
                              soundManager.playClick();
                            }}
                            className="w-full text-left p-3.5 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between text-xs font-mono"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground/75 shrink-0" />
                              <div className="truncate">
                                <p className="text-foreground font-semibold truncate">{node.name}</p>
                                <p className="text-[10px] text-muted-foreground/60 truncate">{node.location}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[8px] uppercase shrink-0 font-sans ${getNodeBadgeStyle(node.type)}`}>
                              {node.type}
                            </Badge>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Landing Empty state metrics grid */}
              {!selectedDepNode && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid gap-6 md:grid-cols-3"
                >
                  {/* Popular Nodes */}
                  <motion.div variants={itemVariants}>
                    <Card className="border border-white/5 bg-white/[0.01] hover:border-primary/10 transition-colors">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Popular Symbols
                          </CardTitle>
                          <CardDescription className="text-[9px] text-muted-foreground">
                            Highest importance nodes.
                          </CardDescription>
                        </div>
                        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 space-y-2.5">
                        {popularNodes.map((node) => (
                          <motion.div
                            key={node.id}
                            whileHover={{ scale: 1.02, x: 2 }}
                            onClick={() => {
                              setSelectedDepNode(node);
                              addToRecentlyViewed(node.id);
                              soundManager.playClick();
                            }}
                            className="p-2.5 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all duration-200 cursor-pointer flex items-center justify-between font-mono text-[11px]"
                          >
                            <span className="text-foreground font-semibold truncate max-w-[120px]">{node.name}</span>
                            <span className="text-[9px] text-muted-foreground/50">Score: {node.importance_score?.toFixed(1)}</span>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Connected Nodes */}
                  <motion.div variants={itemVariants}>
                    <Card className="border border-white/5 bg-white/[0.01] hover:border-secondary/10 transition-colors">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Central Hubs
                          </CardTitle>
                          <CardDescription className="text-[9px] text-muted-foreground">
                            Highest degree connections.
                          </CardDescription>
                        </div>
                        <Network className="h-4 w-4 text-secondary shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 space-y-2.5">
                        {mostConnectedNodes.map((node) => {
                          const deg = data?.graph.adjacency_map[node.id]?.length || 0;
                          return (
                            <motion.div
                              key={node.id}
                              whileHover={{ scale: 1.02, x: 2 }}
                              onClick={() => {
                                setSelectedDepNode(node);
                                addToRecentlyViewed(node.id);
                                soundManager.playClick();
                              }}
                              className="p-2.5 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all duration-200 cursor-pointer flex items-center justify-between font-mono text-[11px]"
                            >
                              <span className="text-foreground font-semibold truncate max-w-[120px]">{node.name}</span>
                              <span className="text-[9px] text-muted-foreground/50">Edges: {deg}</span>
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recently Viewed Nodes */}
                  <motion.div variants={itemVariants}>
                    <Card className="border border-white/5 bg-white/[0.01] hover:border-[#00FFC6]/10 transition-colors">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Recently Viewed
                          </CardTitle>
                          <CardDescription className="text-[9px] text-muted-foreground">
                            Your exploration logs.
                          </CardDescription>
                        </div>
                        <History className="h-4 w-4 text-[#00FFC6] shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 space-y-2.5">
                        {recentlyViewedNodes.length > 0 ? (
                          recentlyViewedNodes.map((node) => (
                            <motion.div
                              key={node.id}
                              whileHover={{ scale: 1.02, x: 2 }}
                              onClick={() => {
                                setSelectedDepNode(node);
                                soundManager.playClick();
                              }}
                              className="p-2.5 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all duration-200 cursor-pointer flex items-center justify-between font-mono text-[11px]"
                            >
                              <span className="text-foreground font-semibold truncate max-w-[120px]">{node.name}</span>
                              <Badge variant="outline" className="text-[7px] uppercase font-sans py-0 px-1 bg-white/5 border-white/5">
                                {node.type}
                              </Badge>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-[10px] text-muted-foreground/40 font-mono">
                            No viewing logs active yet.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {/* Selected Node Details & Relationships Panel */}
              {selectedDepNode && selectedNodeMetrics && (
                <div className="space-y-6">
                  {/* Node Header Overview & Statistics */}
                  <Card className="border border-white/5 bg-white/[0.01] relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#7C5CFF]/30 to-transparent" />
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-white/5">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                              ACTIVE TARGET
                            </span>
                            <Badge variant="outline" className={`text-[8px] font-semibold uppercase px-2 py-0.5 ${getNodeBadgeStyle(selectedDepNode.type)}`}>
                              {selectedDepNode.type}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-heading font-black tracking-tight text-foreground font-mono truncate">
                            {selectedDepNode.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-sans break-all select-text font-medium bg-white/[0.02] border border-white/5 px-2 py-1 rounded">
                            {selectedDepNode.location}
                          </p>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyPath(selectedDepNode.location, selectedDepNode.id)}
                            className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/40 border border-border/40 px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedNodeId === selectedDepNode.id ? "Copied" : "Copy Path"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenInGraph(selectedDepNode)}
                            className="text-[10px] font-heading font-black uppercase tracking-wider text-white bg-primary hover:brightness-110 border border-primary/20 px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            Open in Graph
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Performance Centrality Metrics Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5 pt-4 font-mono text-[10px]">
                        {[
                          { label: "RKE Importance", val: selectedNodeMetrics.importance.toFixed(1), col: "text-primary" },
                          { label: "Centrality", val: selectedNodeMetrics.centrality, col: "text-[#00FFC6]" },
                          { label: "Imports", val: selectedNodeMetrics.imports, col: "text-foreground" },
                          { label: "Calls", val: selectedNodeMetrics.calls, col: "text-foreground" },
                          { label: "Renders", val: selectedNodeMetrics.renders, col: "text-foreground" },
                          { label: "Total Relations", val: selectedNodeMetrics.relations, col: "text-foreground" },
                        ].map((mBox, idx) => (
                          <motion.div
                            key={mBox.label}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -2, borderColor: "rgba(124,92,255,0.2)" }}
                            className="bg-secondary/15 rounded-xl border border-white/5 p-3 text-center transition-all duration-200"
                          >
                            <p className="text-muted-foreground/60 uppercase text-[8px] tracking-wide font-black">{mBox.label}</p>
                            <p className={`text-base font-bold mt-1 ${mBox.col}`}>{mBox.val}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Two-Column Dependency Viewer Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Outgoing: Depends On */}
                    <Card className="border border-white/5 bg-white/[0.01] shadow-sm">
                      <CardHeader className="py-4 border-b border-white/5 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Depends On ({dependsOnList.length})
                          </CardTitle>
                          <CardDescription className="text-[10px] text-muted-foreground/60">
                            Outgoing references, module imports and child components.
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
                        {dependsOnList.length > 0 ? (
                          <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                          >
                            {dependsOnList.map((dep) => {
                              const Icon = getNodeIcon(dep.node.type);
                              return (
                                <motion.div
                                  key={dep.edge.id}
                                  variants={itemVariants}
                                  whileHover={{ scale: 1.01 }}
                                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all font-mono"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-semibold text-foreground truncate">{dep.node.name}</span>
                                      <Badge variant="outline" className={`text-[7px] py-0 px-1 uppercase ${getNodeBadgeStyle(dep.node.type)}`}>
                                        {dep.node.type}
                                      </Badge>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/60 truncate mt-1 select-text">{dep.node.location}</p>
                                    <p className="text-[8px] text-primary italic uppercase mt-1.5 tracking-wide">Relation: {dep.edge.relation.toLowerCase()}</p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPath(dep.node.location, dep.node.id)}
                                      className="text-[9px] text-muted-foreground hover:text-foreground cursor-pointer bg-white/5 p-1.5 rounded transition-colors"
                                      title="Copy Path"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInGraph(dep.node)}
                                      className="text-[9px] text-primary hover:text-[#00FFC6] transition-colors cursor-pointer shrink-0 font-bold"
                                    >
                                      Open
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        ) : (
                          <p className="text-center py-10 text-xs text-muted-foreground font-mono">
                            No outgoing dependencies or calls detected.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Incoming: Used By */}
                    <Card className="border border-white/5 bg-white/[0.01] shadow-sm">
                      <CardHeader className="py-4 border-b border-white/5 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Used By ({usedByList.length})
                          </CardTitle>
                          <CardDescription className="text-[10px] text-muted-foreground/60">
                            Incoming callers, module importers and parent renders.
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
                        {usedByList.length > 0 ? (
                          <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                          >
                            {usedByList.map((dep) => {
                              const Icon = getNodeIcon(dep.node.type);
                              return (
                                <motion.div
                                  key={dep.edge.id}
                                  variants={itemVariants}
                                  whileHover={{ scale: 1.01 }}
                                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/5 bg-secondary/15 hover:border-[#00FFC6]/20 transition-all font-mono"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-semibold text-foreground truncate">{dep.node.name}</span>
                                      <Badge variant="outline" className={`text-[7px] py-0 px-1 uppercase ${getNodeBadgeStyle(dep.node.type)}`}>
                                        {dep.node.type}
                                      </Badge>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/60 truncate mt-1 select-text">{dep.node.location}</p>
                                    <p className="text-[8px] text-[#00FFC6] italic uppercase mt-1.5 tracking-wide">Relation: {dep.edge.relation.toLowerCase()}</p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPath(dep.node.location, dep.node.id)}
                                      className="text-[9px] text-muted-foreground hover:text-foreground cursor-pointer bg-white/5 p-1.5 rounded transition-colors"
                                      title="Copy Path"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInGraph(dep.node)}
                                      className="text-[9px] text-primary hover:text-[#00FFC6] transition-colors cursor-pointer shrink-0 font-bold"
                                    >
                                      Open
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        ) : (
                          <p className="text-center py-10 text-xs text-muted-foreground font-mono">
                            No incoming references or importers found.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
