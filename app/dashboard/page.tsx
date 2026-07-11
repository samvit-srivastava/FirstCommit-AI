import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RepoInfoPanel } from "@/components/dashboard/RepoInfoPanel";
import {
  mockAnalysis,
  mockOverviewStats,
  mockRecentActivity,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analysis overview for{" "}
          <span className="font-medium text-foreground">
            {mockAnalysis.summary.name}
          </span>
        </p>
      </div>

      {/* Overview stat cards */}
      <OverviewCards stats={mockOverviewStats} />

      {/* Two-column layout: activity + actions on left, repo info on right */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentActivity activities={mockRecentActivity} />
          <QuickActions />
        </div>
        <div>
          <RepoInfoPanel summary={mockAnalysis.summary} />
        </div>
      </div>
    </div>
  );
}
