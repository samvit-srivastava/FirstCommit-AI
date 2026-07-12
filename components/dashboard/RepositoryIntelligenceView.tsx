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
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

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
        locatorInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Fuzzy Search Resolver (Tab 1: Where is X?)
  const handleLocatorSearch = (queryStr: string) => {
    if (!data?.graph.nodes) return;
    const cleanQuery = queryStr.trim().toLowerCase();
    if (!cleanQuery) {
      setLocatorResults([]);
      return;
    }

    soundManager.playClick();

    // Matching Algorithm
    const scored = data.graph.nodes
      .map((node) => {
        let score = 0;
        const nameLower = node.name.toLowerCase();
        const locLower = node.location.toLowerCase();
        const typeLower = node.type.toLowerCase();

        // 1. Exact Name match
        if (nameLower === cleanQuery) {
          score += 1500;
        }
        // 2. Substring Name match
        else if (nameLower.includes(cleanQuery)) {
          score += 600;
        }
        // 3. Substring Location match
        if (locLower.includes(cleanQuery)) {
          score += 300;
        }
        // 4. Type match
        if (typeLower.includes(cleanQuery)) {
          score += 150;
        }

        const words = cleanQuery.split(/\s+/);
        let wordMatches = 0;
        words.forEach((w) => {
          if (nameLower.includes(w) || locLower.includes(w)) {
            wordMatches++;
          }
        });
        score += wordMatches * 100;

        const degree = data.graph.adjacency_map[node.id]?.length || 0;
        score += (node.importance_score || 0) * 120;
        score += degree * 15;

        return { node, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.node)
      .slice(0, 10);

    setLocatorResults(scored);
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

  // Tab 2: Mermaid Code Builder Memo
  const mermaidCode = useMemo(() => {
    if (!data?.graph.nodes) return "";

    const nodes = data.graph.nodes;
    const edges = data.graph.edges;

    const frontendNodes = nodes
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

    const backendNodes = nodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes("service") ||
          n.name.toLowerCase().includes("parser") ||
          n.name.toLowerCase().includes("engine") ||
          n.location.toLowerCase().includes("backend/") ||
          n.location.toLowerCase().includes("routes/")
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
      .slice(0, 20);

    if (frontendNodes.length === 0 && backendNodes.length === 0) {
      const topNodes = [...nodes]
        .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
        .slice(0, 12);
      const topIds = new Set(topNodes.map((n) => n.id));
      const topEdges = edges
        .filter(
          (e) =>
            topIds.has(e.source) &&
            topIds.has(e.target) &&
            e.relation !== "CONTAINS" &&
            e.relation !== "BELONGS_TO"
        )
        .slice(0, 12);

      let fallbackCode = "graph TD\n";
      fallbackCode += "  classDef nodeStyle fill:#8B5CF620,stroke:#8B5CF6,stroke-width:1px,color:#fff;\n";
      topNodes.forEach((n) => {
        const label = n.name.replace(/[\[\]\(\)\{\}]/g, "");
        fallbackCode += `  ${n.id}["${label} (${n.type})"]\n`;
        fallbackCode += `  class ${n.id} nodeStyle;\n`;
      });
      topEdges.forEach((e) => {
        fallbackCode += `  ${e.source} --> ${e.target}\n`;
      });
      return fallbackCode;
    }

    let code = "graph TD\n";
    code += "  classDef frontend fill:#3b82f620,stroke:#3b82f6,stroke-width:1px,color:#fff;\n";
    code += "  classDef backend fill:#10b98120,stroke:#10b981,stroke-width:1px,color:#fff;\n";
    code += "  classDef route fill:#8b5cf620,stroke:#8b5cf6,stroke-width:1px,color:#fff;\n";

    code += "  subgraph Frontend\n";
    frontendNodes.forEach((n) => {
      const label = n.name.replace(/[\[\]\(\)\{\}]/g, "");
      code += `    ${n.id}["${label}"]\n`;
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
      code += `    ${n.id}["${label}"]\n`;
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
            setMermaidError("Failed to parse and render architectural flow diagram.");
          });
      } catch (err: any) {
        setMermaidError("Failed to render Mermaid layout.");
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

  // Tab 3: Dependency Explorer Tree Builder
  const filteredNodesForDep = useMemo(() => {
    if (!data?.graph.nodes) return [];
    const query = depSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return data.graph.nodes
      .filter((n) => n.name.toLowerCase().includes(query) || n.location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [depSearchQuery, data]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const DependencyTreeBranch = ({ nodeId, depth = 0 }: { nodeId: string; depth: number }) => {
    const node = data?.graph.nodes.find((n) => n.id === nodeId);
    const isExpanded = !!expandedNodes[nodeId];

    const dependencies = useMemo(() => {
      if (!data?.graph.edges || depth >= 3) return [];
      return data.graph.edges
        .filter((e) => e.source === nodeId && e.relation !== "CONTAINS" && e.relation !== "BELONGS_TO")
        .map((e) => ({
          targetId: e.target,
          relation: e.relation,
          id: e.id,
        }));
    }, [nodeId, depth]);

    if (!node) return null;

    const hasDeps = dependencies.length > 0;

    return (
      <div className="pl-4 border-l border-white/5 space-y-1.5 mt-1 font-mono">
        <div className="flex items-center gap-2 text-xs py-1">
          {hasDeps ? (
            <button
              type="button"
              onClick={() => toggleExpand(nodeId)}
              className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-3" />
          )}

          <span className="text-muted-foreground/35 select-none">{depth > 0 ? "↳" : "•"}</span>

          <span className="text-foreground font-semibold">{node.name}</span>
          <span className="text-[9px] uppercase tracking-wider bg-white/[0.03] border border-white/5 text-muted-foreground px-1.5 py-0.5 rounded font-sans">
            {node.type}
          </span>

          <button
            type="button"
            onClick={() => handleOpenInGraph(node.id)}
            className="text-primary hover:text-[#00FFC6] text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer ml-3 font-sans"
          >
            Open <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>

        {isExpanded && hasDeps && (
          <div className="space-y-1">
            {dependencies.map((dep) => {
              const targetNode = data?.graph.nodes.find((n) => n.id === dep.targetId);
              if (!targetNode) return null;
              return (
                <div key={dep.id} className="pl-4">
                  <div className="text-[10px] text-muted-foreground/50 italic flex items-center gap-1">
                    <span>{dep.relation.toLowerCase()}</span>
                  </div>
                  <DependencyTreeBranch nodeId={dep.targetId} depth={depth + 1} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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

  if (!repoUrl) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm font-mono">
        No active repository details found. Please analyze a repository.
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 select-none">
      {/* 1. Top Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
          <Cpu className="h-7 w-7 text-primary" />
          Repository Intelligence
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
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
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.02]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Lazy Tab Views Container */}
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
                  <CardTitle className="text-sm font-bold text-foreground">
                    Intelligent Repository Locator
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                    Search files, routes, classes, or symbols using fuzzy name and path matching. Press{" "}
                    <code className="bg-secondary/40 px-1 py-0.5 rounded text-primary font-bold">/</code> or{" "}
                    <code className="bg-secondary/40 px-1 py-0.5 rounded text-primary font-bold">Ctrl+K</code> to focus.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Big Search Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLocatorSearch(locatorQuery);
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        ref={locatorInputRef}
                        type="text"
                        placeholder="Where is authentication? Where is Graph Explorer?"
                        value={locatorQuery}
                        onChange={(e) => setLocatorQuery(e.target.value)}
                        className="w-full bg-secondary/40 text-sm rounded-xl pl-10 pr-4 py-3 border border-border/40 focus:outline-none focus:border-primary/50 text-foreground font-mono"
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:brightness-110 cursor-pointer">
                      Search
                    </Button>
                  </form>

                  {/* Suggestion Quick Links */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground/45 uppercase tracking-widest font-black">
                      Quick Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "authentication",
                        "GraphExplorer",
                        "Dashboard",
                        "analysis",
                        "router",
                        "api",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="text-[10px] font-semibold bg-secondary/20 hover:bg-primary/10 border border-border/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-foreground/85 hover:text-primary"
                        >
                          Where is {s}?
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Locator Results Underneath */}
              <div className="space-y-4">
                {locatorResults.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {locatorResults.map((node) => {
                      const degree = data?.graph.adjacency_map[node.id]?.length || 0;
                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col justify-between hover:border-primary/20 transition-all duration-300"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-sm font-semibold text-foreground truncate font-mono">
                                {node.name}
                              </span>
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-white/[0.03] border border-white/5 text-muted-foreground px-2 py-0.5 rounded font-sans shrink-0">
                                {node.type}
                              </Badge>
                            </div>

                            <p className="text-[10px] font-mono text-muted-foreground/60 break-all mb-3.5">
                              {node.location}
                            </p>

                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                              <span>Score: {node.importance_score?.toFixed(1) || "1.0"}</span>
                              <span>Degree: {degree}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenInGraph(node.id)}
                              className="text-xs text-primary hover:text-[#00FFC6] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Open in Graph
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  locatorQuery.trim() !== "" && (
                    <div className="text-center py-10 text-muted-foreground text-xs font-mono">
                      No matching elements found. Try a different query.
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Architecture */}
          {activeTab === "architecture" && (
            <div className="space-y-6">
              <Card className="glass border-border/40">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/5">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Dynamic Architecture Diagram
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                      Generated dynamically from high-level backend services and frontend components relationships.
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
                      {diagramCopied ? "Copied" : "Copy Source"}
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
                          : "h-[450px]"
                      }`}
                    >
                      {/* Zoom Controls */}
                      <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 z-10">
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
                          Compiling architecture layouts...
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

          {/* TAB 3: Dependencies */}
          {activeTab === "dependencies" && (
            <div className="space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Interactive Dependency Explorer
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                    Search and select a symbol or file node to map out its import and render dependencies recursively.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select Search Node */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type a component, file name, class..."
                      value={depSearchQuery}
                      onChange={(e) => setDepSearchQuery(e.target.value)}
                      className="w-full bg-secondary/40 text-sm rounded-xl pl-10 pr-4 py-3 border border-border/40 focus:outline-none focus:border-primary/50 text-foreground font-mono"
                    />
                  </div>

                  {/* Autocomplete list */}
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
                          className="w-full text-left p-3 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between text-xs font-mono"
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

                  {/* Node Tree Render */}
                  {selectedDepNode && (
                    <div className="mt-8 border border-white/5 bg-white/[0.01] rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-muted-foreground text-xs uppercase font-sans font-bold">Selected Element:</span>
                          <span className="text-foreground font-semibold text-sm">{selectedDepNode.name}</span>
                          <Badge variant="outline" className="text-[8px] uppercase shrink-0 font-sans">
                            {selectedDepNode.type}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenInGraph(selectedDepNode.id)}
                          className="text-xs text-primary hover:text-[#00FFC6] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Open in Graph
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Collapsible tree root */}
                      <div className="py-2 overflow-x-auto">
                        <DependencyTreeBranch nodeId={selectedDepNode.id} depth={0} />
                      </div>
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
