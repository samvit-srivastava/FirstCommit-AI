"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface TechStackItem {
  name: string;
  category: string;
  icon: string;
}

export interface FolderExplanationItem {
  path: string;
  purpose: string;
}

export interface BackendRoadmapStep {
  step_number: number;
  title: string;
  description: string;
}

export interface DetailedTechItem {
  id: string;
  display_name: string;
  name: string;
  category: string;
  confidence: number;
  evidence: string;
  coverage: number;
  version: string | null;
}

export interface DetailedFolderItem {
  name: string;
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
}

export interface BackendAnalysisResult {
  summary: string;
  tech_stack: TechStackItem[];
  folder_explanation: FolderExplanationItem[];
  roadmap: BackendRoadmapStep[];
  repository_name: string;
  default_branch: string;
  local_clone_path: string;
  clone_status: string;
  project_name: string;
  description: string;
  repository_type: string;
  detected_frameworks: string[];
  detected_languages: string[];
  important_files: { file: string; purpose: string }[];
  top_level_folders: { name: string; purpose: string }[];
  technologies: DetailedTechItem[];
  folders: DetailedFolderItem[];
  readme: string;
  stars: number;
  forks: number;
  watchers: number;
  updated_at: string;
}

interface AnalysisContextType {
  analysisResult: BackendAnalysisResult | null;
  repoUrl: string;
  isLoading: boolean;
  error: string;
  setAnalysis: (data: BackendAnalysisResult, url: string) => void;
  clearAnalysis: () => void;
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysisResult, setAnalysisResult] = useState<BackendAnalysisResult | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");

  const setAnalysis = (data: BackendAnalysisResult, url: string) => {
    setAnalysisResult(data);
    setRepoUrl(url);
    localStorage.setItem("analysis_result", JSON.stringify(data));
    localStorage.setItem("repo_url", url);
    setError("");
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setRepoUrl("");
    localStorage.removeItem("analysis_result");
    localStorage.removeItem("repo_url");
  };

  useEffect(() => {
    try {
      const savedResult = localStorage.getItem("analysis_result");
      const savedUrl = localStorage.getItem("repo_url");

      if (savedResult) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnalysisResult(JSON.parse(savedResult));
      }
      if (savedUrl) {
        setRepoUrl(savedUrl);
      }
    } catch (e) {
      console.error("Failed to load saved analysis:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysisResult,
        repoUrl,
        isLoading,
        error,
        setAnalysis,
        clearAnalysis,
        selectedNodeId,
        setSelectedNodeId
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
