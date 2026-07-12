"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { usePathname, useRouter } from "next/navigation";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();

  // Derive activeSection from pathname
  const activeSection = pathname === "/dashboard" 
    ? "overview" 
    : pathname.split("/").pop() ?? "overview";

  const handleSectionChange = (section: string) => {
    setMobileMenuOpen(false);
    if (section === "overview") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard/${section}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
