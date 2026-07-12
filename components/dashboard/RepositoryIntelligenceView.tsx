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
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Loader2,
  Network,
  Terminal,
  HelpCircle,
  TrendingUp,
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

export function RepositoryIntelligenceView() {
  const { repoUrl, analysisResult, setSelectedNodeId } = useAnalysis();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"locator" | "architecture" | "dependencies">("locator");
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab 1: Locator State
  const [locatorQuery, setLocatorQuery] = useState("");
  const [locatorResults, setLocatorResults] = useState<GraphNode[]>([]);
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const locatorInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Architecture State
  const [mermaidInstance, setMermaidInstance] = useState<any>(null);
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [mermaidError, setMermaidError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [diagramCopied, setDiagramCopied] = useState(false);

  // Tab 3: Dependency Explorer State
  const [depSearchQuery, setDepSearchQuery] = useState("");
  const [selectedDepNode, setSelectedDepNode] = useState<GraphNode | null>(null);
  const [dependsOnExpanded, setDependsOnExpanded] = useState(true);
  const [usedByExpanded, setUsedByExpanded] = useState(true);

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

  // 2. Load Mermaid Dynamically
  useEffect(() => {
    if (activeTab === "architecture" && !mermaidInstance) {
      import("mermaid")
        .then((m) => {
          m.default.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
            flowchart: {
              useMaxWidth: false,
              htmlLabels: true,
              curve: "basis",
            },
          });
          setMermaidInstance(m.default);
        })
        .catch((err) => {
          console.error("Failed to load Mermaid: ", err);
          setMermaidError("Failed to initialize Mermaid diagram library.");
        });
    }
  }, [activeTab, mermaidInstance]);

  // Keyboard listener for Locator Tab & Global search focus (Ctrl+K or /)
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

  // Natural Language Query Filter
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

    // Matching Algorithm
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
        score += 12000;
      } else if (isExactFile) {
        score += 10000;
      } else if (isExactRoute) {
        score += 8000;
      }

      // Partial matches
      if (nameLower.includes(cleanSearch)) {
        score += 3000;
      }
      if (locLower.includes(cleanSearch)) {
        score += 1500;
      }

      // Subsequence split matches
      const terms = cleanSearch.split(/\s+/);
      let matches = 0;
      terms.forEach((t) => {
        if (nameLower.includes(t) || locLower.includes(t)) {
          matches++;
        }
      });
      score += matches * 250;

      // Centrality degree & Importance score
      const degree = data.graph.adjacency_map[node.id]?.length || 0;
      score += (node.importance_score || 0) * 180;
      score += degree * 12;

      const hasMatch = matches > 0 || isExactSymbol || isExactFile || isExactRoute || nameLower.includes(cleanSearch) || locLower.includes(cleanSearch);

      return { node, score, hasMatch };
    });

    const matches = scored.filter((item) => item.score > 200 && item.hasMatch);

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

  const handleOpenInGraph = (nodeId: string) => {
    soundManager.playSuccess();
    setSelectedNodeId(nodeId);
    router.push("/dashboard/graph");
  };

  // Node Description Generator
  const getNodeDescription = (node: GraphNode): string => {
    const type = node.type.toLowerCase();
    if (type === "component") {
      return "Component module orchestrating UI rendering elements.";
    }
    if (type === "file") {
      return "Project source module defining exports and references.";
    }
    if (type === "route") {
      return "Active HTTP request path handled by codebase router.";
    }
    if (type === "function") {
      return "Functional execution helper or module callback.";
    }
    if (type === "class") {
      return "Workspace class entity definition structures.";
    }
    if (type === "folder") {
      return "Root path segment dividing project sections.";
    }
    return "Repository index parameter node.";
  };

  // Tab 2: Architecture Diagram Builder
  const mermaidCode = useMemo(() => {
    if (!data?.graph.nodes) return "";

    const nodes = data.graph.nodes;
    const edges = data.graph.edges;

    // Filtration: remove noise (css, readmes, constants, icons, favicon)
    const ignoreKeywords = [".css", "readme.md", "favicon", "assets", ".json", "config", "types", "constants", "icon", "node_modules", ".git"];
    const allowedKeywords = ["page", "layout", "provider", "component", "service", "controller", "parser", "engine", "route", "api", "db", "database", "github", "view", "context"];

    const architecturalNodes = nodes.filter((n) => {
      const name = n.name.toLowerCase();
      const loc = n.location.toLowerCase();
      if (ignoreKeywords.some((kw) => name.includes(kw) || loc.includes(kw))) {
        return false;
      }
      return allowedKeywords.some((kw) => name.includes(kw) || loc.includes(kw) || n.type.toLowerCase().includes(kw));
    });

    const frontendNodes = architecturalNodes
      .filter(
        (n) =>
          n.type === "Route" ||
          n.type === "Component" ||
          n.name.toLowerCase().includes("page") ||
          n.name.toLowerCase().includes("layout") ||
          n.location.toLowerCase().includes("components/") ||
          n.location.toLowerCase().includes("app/")
      )
      .slice(0, 10);

    const backendNodes = architecturalNodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes("service") ||
          n.name.toLowerCase().includes("parser") ||
          n.name.toLowerCase().includes("engine") ||
          n.location.toLowerCase().includes("backend/") ||
          n.location.toLowerCase().includes("routes/") ||
          n.location.toLowerCase().includes("api/")
      )
      .slice(0, 10);

    const matchedNodeIds = new Set([...frontendNodes, ...backendNodes].map((n) => n.id));

    const filteredEdges = edges
      .filter(
        (e) =>
          matchedNodeIds.has(e.source) &&
          matchedNodeIds.has(e.target) &&
          e.relation !== "CONTAINS" &&
          e.relation !== "BELONGS_TO"
      )
      .slice(0, 15);

    // If empty fallback
    if (frontendNodes.length === 0 && backendNodes.length === 0) {
      const topNodes = [...nodes]
        .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
        .slice(0, 10);
      const topIds = new Set(topNodes.map((n) => n.id));
      const topEdges = edges
        .filter(
          (e) =>
            topIds.has(e.source) &&
            topIds.has(e.target) &&
            e.relation !== "CONTAINS" &&
            e.relation !== "BELONGS_TO"
        )
        .slice(0, 10);

      let fallbackCode = "graph LR\n";
      fallbackCode += "  classDef fallback fill:#7C5CFF10,stroke:#7C5CFF,stroke-width:1px,color:#fff;\n";
      topNodes.forEach((n) => {
        const label = n.name.replace(/[\[\]\(\)\{\}]/g, "");
        fallbackCode += `  ${n.id}("${label} (${n.type})")\n`;
        fallbackCode += `  class ${n.id} fallback;\n`;
      });
      topEdges.forEach((e) => {
        fallbackCode += `  ${e.source} --> ${e.target}\n`;
      });
      return fallbackCode;
    }

    // Generate Left-to-Right System Diagram
    let code = "graph LR\n";
    code += "  classDef frontend fill:#3b82f610,stroke:#3b82f6,stroke-width:1px,color:#fff;\n";
    code += "  classDef backend fill:#10b98110,stroke:#10b981,stroke-width:1px,color:#fff;\n";
    code += "  classDef route fill:#8b5cf610,stroke:#8b5cf6,stroke-width:1px,color:#fff;\n";

    code += "  subgraph Frontend\n";
    frontendNodes.forEach((n) => {
      const label = n.name.replace(/[\[\]\(\)\{\}]/g, "");
      code += `    ${n.id}("${label}")\n`;
      if (n.type === "Route") {
        code += `    class ${n.id} route;\n`;
      } else {
        code += `    class ${n.id} frontend;\n`;
      }
    });
    code += "  end\n";

    code += "  subgraph Backend\n";
    backendNodes.forEach((n) => {
      const label = n.name.replace(/[\[\]\(\)\{\}]/g, "");
      code += `    ${n.id}("${label}")\n`;
      code += `    class ${n.id} backend;\n`;
    });
    code += "  end\n";

    filteredEdges.forEach((e) => {
      const relLabel = e.relation.toLowerCase();
      code += `  ${e.source} -->|${relLabel}| ${e.target}\n`;
    });

    return code;
  }, [data]);

  useEffect(() => {
    if (activeTab === "architecture" && mermaidInstance && mermaidCode) {
      setMermaidError("");
      try {
        const renderId = "mermaid-svg-" + Date.now();
        mermaidInstance
          .render(renderId, mermaidCode)
          .then((res: any) => {
            setMermaidSvg(res.svg);
          })
          .catch((err: any) => {
            console.error(err);
            setMermaidError("Failed to parse and render system flow diagram.");
          });
      } catch (err: any) {
        setMermaidError("Failed to compile layout.");
      }
    }
  }, [activeTab, mermaidInstance, mermaidCode]);

  const handleCopyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setDiagramCopied(true);
      setTimeout(() => setDiagramCopied(false), 2000);
      soundManager.playSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSvg = () => {
    if (!mermaidSvg) return;
    try {
      const blob = new Blob([mermaidSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `architecture_${data?.repository || "codebase"}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      soundManager.playSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  // Tab 3: Dependency Explorer Filtering
  const filteredNodesForDep = useMemo(() => {
    if (!data?.graph.nodes) return [];
    const query = depSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return data.graph.nodes
      .filter((n) => n.name.toLowerCase().includes(query) || n.location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [depSearchQuery, data]);

  // Depends On List (outgoing relations)
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

  // Used By / Imported By List (incoming relations)
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

  if (!repoUrl) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm font-mono">
        No active repository details found. Please analyze a repository.
      </div>
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
          Understand large repositories through architecture, dependencies and intelligent navigation.
        </p>
      </div>

      {/* 2. Navigation Tabs Row */}
      <div className="flex border-b border-white/5 space-x-2 shrink-0 overflow-x-auto pb-1 bg-black/10 rounded-xl p-1">
        {[
          { id: "locator", label: "📍 Where is X?" },
          { id: "architecture", label: "🗺 Architecture" },
          { id: "dependencies", label: "📊 Dependencies" },
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
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/10"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.02]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Lazy Tab Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: Where is X? */}
          {activeTab === "locator" && (
            <div className="space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Search className="h-4.5 w-4.5 text-primary" />
                    Natural Language locator
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                    Search files, routes, classes, or components in the cache index. Press{" "}
                    <code className="bg-secondary/40 px-1 py-0.5 rounded text-primary font-bold">/</code> to focus.
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
                        className="w-full bg-secondary/40 text-sm rounded-xl pl-11 pr-4 py-3 border border-border/40 focus:outline-none focus:border-primary/50 text-foreground font-mono"
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:brightness-110 cursor-pointer font-bold px-6 py-3 rounded-xl">
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
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="text-[10px] font-semibold bg-secondary/20 hover:bg-primary/10 border border-border/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-foreground/85 hover:text-primary font-mono"
                        >
                          where is {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Cards */}
              <div className="space-y-4">
                {isFallbackResult && locatorResults.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs font-mono">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>No exact match found. Showing closest repository suggestions:</span>
                  </div>
                )}

                {locatorResults.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {locatorResults.map((node) => {
                      const degree = data?.graph.adjacency_map[node.id]?.length || 0;
                      const typeColors = node.type === "Component"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : node.type === "Function"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : node.type === "Route"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-sky-500/10 text-sky-400 border-sky-500/20";

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate font-mono">
                                {node.name}
                              </span>
                              <Badge variant="outline" className={`text-[8px] font-semibold tracking-wide uppercase px-2 py-0.5 ${typeColors}`}>
                                {node.type}
                              </Badge>
                            </div>

                            <p className="text-[10px] font-mono text-muted-foreground/60 break-all select-text bg-white/[0.02] p-2 rounded-lg border border-white/5">
                              {node.location}
                            </p>

                            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
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

                          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenInGraph(node.id)}
                              className="text-xs text-primary hover:text-[#00FFC6] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Open in Graph
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  locatorQuery.trim() !== "" && (
                    <div className="text-center py-10 text-muted-foreground text-xs font-mono">
                      No results found. Try suggesting keywords like config or page.
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Architecture Diagram */}
          {activeTab === "architecture" && (
            <div className="space-y-6">
              <Card className="glass border-border/40">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/5">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Repository Architecture Diagram
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                      System overview diagram excluding configuration assets and structural type boilerplate files.
                    </CardDescription>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopyMermaid}
                      variant="outline"
                      size="sm"
                      className="text-xs cursor-pointer border-white/10 hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      {diagramCopied ? "Copied" : "Copy Mermaid"}
                    </Button>
                    <Button
                      onClick={handleDownloadSvg}
                      variant="outline"
                      size="sm"
                      className="text-xs cursor-pointer border-white/10 hover:bg-white/5"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download SVG
                    </Button>
                    <Button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      variant="outline"
                      size="sm"
                      className="text-xs cursor-pointer border-white/10 hover:bg-white/5"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                          Exit Fullscreen
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                          Fullscreen
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {mermaidError ? (
                    <div className="text-center py-10 text-destructive text-xs font-mono">
                      {mermaidError}
                    </div>
                  ) : (
                    <div
                      className={`relative flex items-center justify-center bg-secondary/15 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 ${
                        isFullscreen
                          ? "fixed inset-4 z-50 bg-[#030712]/98 border-primary/30 p-8 shadow-2xl"
                          : "h-[480px]"
                      }`}
                    >
                      {/* Zoom HUD */}
                      <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 z-10 select-none">
                        <button
                          type="button"
                          onClick={() => setZoomScale((prev) => Math.min(prev + 0.15, 2.5))}
                          className="h-8 w-8 rounded-lg bg-secondary/90 hover:bg-secondary border border-border/40 text-foreground flex items-center justify-center cursor-pointer shadow"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomScale((prev) => Math.max(prev - 0.15, 0.4))}
                          className="h-8 w-8 rounded-lg bg-secondary/90 hover:bg-secondary border border-border/40 text-foreground flex items-center justify-center cursor-pointer shadow"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomScale(1)}
                          className="h-8 w-8 rounded-lg bg-secondary/90 hover:bg-secondary border border-border/40 text-foreground flex items-center justify-center cursor-pointer shadow text-[9px] font-mono font-bold"
                        >
                          RESET
                        </button>
                      </div>

                      {isFullscreen && (
                        <button
                          type="button"
                          onClick={() => setIsFullscreen(false)}
                          className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-secondary/90 border border-border/40 text-foreground flex items-center justify-center cursor-pointer z-10"
                        >
                          <Minimize2 className="h-4 w-4" />
                        </button>
                      )}

                      {!mermaidSvg ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Compiling architecture system flowchart...
                        </div>
                      ) : (
                        <div
                          className="w-full h-full overflow-auto flex items-center justify-center p-4 scrollbar-thin select-text"
                          style={{ transform: `scale(${zoomScale})`, transformOrigin: "center" }}
                          dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Dependency Explorer */}
          {activeTab === "dependencies" && (
            <div className="space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Dependency System Explorer
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                    Search and select a repository node to view its imports, calls, and incoming relationships.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select Search Node */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type a component name, file path, route..."
                      value={depSearchQuery}
                      onChange={(e) => setDepSearchQuery(e.target.value)}
                      className="w-full bg-secondary/40 text-sm rounded-xl pl-11 pr-4 py-3 border border-border/40 focus:outline-none focus:border-primary/50 text-foreground font-mono"
                    />
                  </div>

                  {/* Autocomplete suggestions */}
                  {filteredNodesForDep.length > 0 && (
                    <div className="bg-secondary/80 border border-border/30 rounded-xl overflow-hidden divide-y divide-white/5 shadow-2xl">
                      {filteredNodesForDep.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedDepNode(node);
                            setDepSearchQuery("");
                            soundManager.playClick();
                          }}
                          className="w-full text-left p-3.5 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between text-xs font-mono"
                        >
                          <div className="min-w-0">
                            <p className="text-foreground font-semibold truncate">{node.name}</p>
                            <p className="text-[10px] text-muted-foreground/60 truncate">{node.location}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] uppercase shrink-0 font-sans">
                            {node.type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dependency Lists splitting */}
                  {selectedDepNode ? (
                    <div className="space-y-6 pt-4">
                      {/* Active header info */}
                      <div className="flex items-center justify-between gap-4 flex-wrap pb-3.5 border-b border-white/5">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-muted-foreground text-xs uppercase font-sans font-bold">Selected Node:</span>
                          <span className="text-foreground font-bold text-sm">{selectedDepNode.name}</span>
                          <Badge variant="outline" className="text-[8px] uppercase font-sans">
                            {selectedDepNode.type}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenInGraph(selectedDepNode.id)}
                          className="text-xs text-primary hover:text-[#00FFC6] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Open in Graph
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Section 1: Depends On (Outgoing) */}
                        <Card className="bg-white/[0.01] border-white/5">
                          <CardHeader className="py-3.5 px-4 border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                              Depends On ({dependsOnList.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {dependsOnList.length > 0 ? (
                              dependsOnList.map((dep) => (
                                <div
                                  key={dep.edge.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all font-mono"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{dep.node.name}</p>
                                    <p className="text-[9px] text-muted-foreground/60 truncate">{dep.node.location}</p>
                                    <p className="text-[9px] text-primary italic uppercase mt-1">Relation: {dep.edge.relation.toLowerCase()}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInGraph(dep.node.id)}
                                    className="text-[9px] text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                                  >
                                    Open
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-6 text-xs text-muted-foreground font-mono">
                                No outgoing dependencies detected.
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Section 2: Used By (Incoming) */}
                        <Card className="bg-white/[0.01] border-white/5">
                          <CardHeader className="py-3.5 px-4 border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                              Used By ({usedByList.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {usedByList.length > 0 ? (
                              usedByList.map((dep) => (
                                <div
                                  key={dep.edge.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-secondary/15 hover:border-primary/20 transition-all font-mono"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{dep.node.name}</p>
                                    <p className="text-[9px] text-muted-foreground/60 truncate">{dep.node.location}</p>
                                    <p className="text-[9px] text-[#00FFC6] italic uppercase mt-1">Relation: {dep.edge.relation.toLowerCase()}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInGraph(dep.node.id)}
                                    className="text-[9px] text-muted-foreground hover:text-[#00FFC6] transition-colors cursor-pointer shrink-0"
                                  >
                                    Open
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-6 text-xs text-muted-foreground font-mono">
                                No incoming callers or importers found.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-xs font-mono">
                      Type and select a node above to inspect its dependencies.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
