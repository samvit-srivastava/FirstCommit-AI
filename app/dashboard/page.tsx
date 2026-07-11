"use client";

import { useAnalysis } from "@/lib/AnalysisContext";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RepoInfoPanel } from "@/components/dashboard/RepoInfoPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { analysisResult, isLoading } = useAnalysis();

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading analysis details...</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="mx-auto max-w-md text-center py-16 space-y-6">
        <h2 className="text-xl font-bold tracking-tight">No active repository</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          It looks like you haven't analyzed a repository yet. Please return to the home page and enter a GitHub repository URL.
        </p>
        <Link href="/" passHref legacyBehavior>
          <Button className="gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Landing Page</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Map overview stats dynamically from analysisResult
  const stats = [
    {
      label: "Technologies",
      value: String(analysisResult.tech_stack.length),
      description: "Frameworks, languages, and tools detected",
    },
    {
      label: "Folders Mapped",
      value: String(analysisResult.folder_explanation.length),
      description: "Top-level directories analyzed",
    },
    {
      label: "Roadmap Steps",
      value: String(analysisResult.roadmap.length),
      description: "Personalized onboarding steps generated",
    },
    {
      label: "Clone Status",
      value: analysisResult.clone_status === "reused" ? "Reused" : "Cloned",
      description: "Local checkout status of the repository",
    },
  ];

  // Map activities dynamically from analysisResult
  const activities = [
    {
      id: "a1",
      title: "Repository cloned",
      description: `${analysisResult.repository_name} cloned locally to temp directory`,
      timestamp: "Just now",
    },
    {
      id: "a2",
      title: "Tech stack detected",
      description: `${analysisResult.tech_stack.length} technologies identified`,
      timestamp: "Just now",
    },
    {
      id: "a3",
      title: "Folder structure mapped",
      description: `${analysisResult.folder_explanation.length} primary directories analyzed`,
      timestamp: "Just now",
    },
  ];

  // Format ProjectSummary to fit UI props mapping
  const mappedSummary = {
    name: analysisResult.repository_name,
    description: analysisResult.summary,
    purpose: "Provide developers with an accelerated onboarding path to understand and contribute to the repository quickly.",
    architecture: `Standard structure on branch ${analysisResult.default_branch}. Cloned locally to ${analysisResult.local_clone_path}.`,
    stars: 0,
    language: "Detected",
    url: `https://github.com/${analysisResult.repository_name}`
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analysis overview for{" "}
          <span className="font-semibold text-foreground">
            {analysisResult.repository_name}
          </span>
        </p>
      </div>

      {/* Overview stat cards */}
      <OverviewCards stats={stats} />

      {/* Two-column layout: activity + actions on left, repo info on right */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentActivity activities={activities} />
          <QuickActions />
        </div>
        <div>
          <RepoInfoPanel summary={mappedSummary} />
        </div>
      </div>
    </div>
  );
}
