import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — FirstCommit AI",
  description:
    "Repository analysis dashboard featuring project overview, summary details, onboarding roadmap, relationships graph, and architectural intelligence.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
