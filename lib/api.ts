import type { AnalysisResult } from "@/types";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface AnalyzeBackendResponse {
  summary: string;
  tech_stack: Array<{ name: string; category: string; icon: string }>;
  folder_explanation: Array<{ path: string; purpose: string }>;
  roadmap: Array<{ step_number: number; title: string; description: string }>;
  repository_name: string;
  default_branch: string;
  local_clone_path: string;
  clone_status: string;
  project_name: string;
  description: string;
  repository_type: string;
  detected_frameworks: string[];
  detected_languages: string[];
  important_files: Array<{ file: string; purpose: string }>;
  top_level_folders: Array<{ name: string; purpose: string }>;
  stars?: number;
  forks?: number;
  watchers?: number;
  updated_at?: string;
}

export interface ChatBackendResponse {
  answer: string;
  referenced_files: string[];
}

export function mapBackendResponseToResult(
  backend: AnalyzeBackendResponse,
  repoUrl: string
): AnalysisResult {
  // Map categories to frontend types safely
  const techStack = (backend.tech_stack || []).map((item) => {
    let category: "frontend" | "backend" | "database" | "devops" | "language" | "other" = "other";
    const catLower = item.category.toLowerCase();
    if (catLower === "frontend") category = "frontend";
    else if (catLower === "backend") category = "backend";
    else if (catLower === "database") category = "database";
    else if (catLower === "devops") category = "devops";
    else if (catLower === "language") category = "language";

    return {
      name: item.name,
      category,
    };
  });

  // Map folder explanations
  const folders = (backend.folder_explanation || []).map((item) => ({
    name: item.path.replace(/\//g, "") || item.path,
    path: item.path,
    explanation: item.purpose,
  }));

  // Create a structured roadmap for the 4 roles from flat roadmap steps
  const backendRoadmapSteps = (backend.roadmap || []).map((step) => ({
    step: step.step_number,
    title: step.title,
    description: step.description,
    files: (backend.important_files || [])
      .slice(0, 2)
      .map((f) => f.file),
  }));

  // fallback default steps if roadmap is empty
  const finalSteps = backendRoadmapSteps.length > 0 ? backendRoadmapSteps : [
    {
      step: 1,
      title: "Read Project Documentation",
      description: `Start with README.md to understand the setup of this ${backend.repository_type || "codebase"}.`,
      files: ["README.md"]
    }
  ];

  return {
    summary: {
      name: backend.repository_name || backend.project_name || "Codebase",
      description: backend.description || backend.summary || "No description provided.",
      purpose: `To serve as a modular ${backend.repository_type || "application"} leveraging ${backend.detected_languages?.join(", ") || "multiple technologies"}.`,
      architecture: `Cloned default branch '${backend.default_branch || "main"}' to path: ${backend.local_clone_path || "temp"}.`,
      stars: backend.stars ?? 0,
      forks: backend.forks ?? 0,
      watchers: backend.watchers ?? 0,
      default_branch: backend.default_branch || "main",
      updated_at: backend.updated_at || "",
      language: backend.detected_languages?.[0] || "TypeScript",
      url: repoUrl,
    },
    techStack,
    folders,
    roadmap: {
      frontend: finalSteps,
      backend: finalSteps,
      fullstack: finalSteps,
      opensource: finalSteps,
    },
  };
}

export async function analyzeRepository(repoUrl: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo_url: repoUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to analyze repository.");
  }

  const data: AnalyzeBackendResponse = await response.json();
  return mapBackendResponseToResult(data, repoUrl);
}

export async function chatWithRepository(
  repoId: string,
  question: string
): Promise<ChatBackendResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo_id: repoId, question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to chat with repository.");
  }

  return response.json();
}
