import { BookOpen, Code2, FolderTree, Map } from "lucide-react";

export const APP_NAME = "FirstCommit AI";
export const APP_DESCRIPTION =
  "AI Developer Onboarding Assistant — Understand any GitHub repository and make your first meaningful contribution in minutes.";

export const FEATURES = [
  {
    title: "AI Project Summary",
    description:
      "Instantly understand what a project does, its purpose, and how it's architected.",
    icon: BookOpen,
  },
  {
    title: "Tech Stack Detection",
    description:
      "Automatically detect frameworks, languages, and tools used across the codebase.",
    icon: Code2,
  },
  {
    title: "Folder Explorer",
    description:
      "Get clear explanations of every folder's purpose without reading a single line of code.",
    icon: FolderTree,
  },
  {
    title: "Onboarding Roadmap",
    description:
      "Receive a personalized step-by-step learning path based on your developer role.",
    icon: Map,
  },
] as const;

export const DEVELOPER_ROLES = [
  { value: "frontend" as const, label: "Frontend Developer" },
  { value: "backend" as const, label: "Backend Developer" },
  { value: "fullstack" as const, label: "Full Stack Developer" },
  { value: "opensource" as const, label: "Open Source Contributor" },
] as const;
