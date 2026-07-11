export interface ProjectSummary {
  name: string;
  description: string;
  purpose: string;
  architecture: string;
  stars: number;
  language: string;
  url: string;
}

export interface TechItem {
  name: string;
  category: "frontend" | "backend" | "database" | "devops" | "language" | "other";
}

export interface FolderItem {
  name: string;
  path: string;
  explanation: string;
  children?: FolderItem[];
}

export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  files: string[];
}

export type DeveloperRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "opensource";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  referencedFiles?: string[];
}

export interface AnalysisResult {
  summary: ProjectSummary;
  techStack: TechItem[];
  folders: FolderItem[];
  roadmap: Record<DeveloperRole, RoadmapStep[]>;
}
