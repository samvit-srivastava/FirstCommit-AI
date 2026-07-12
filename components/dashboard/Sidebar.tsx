"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  FolderTree,
  Map,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  X,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "graph", label: "Graph Explorer", icon: Network },
  { id: "chat", label: "Ask Repo", icon: MessageSquare },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  activeSection,
  onSectionChange,
  onMobileClose,
  isMobile,
}: SidebarProps & { isMobile?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b border-border/40 px-4",
          collapsed && !isMobile ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </span>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3" aria-label="Dashboard navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer",
                collapsed && !isMobile ? "justify-center px-2" : "",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!isMobile && (
        <div className="border-t border-border/40 p-2">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-border/40 bg-card/50 transition-all duration-200 md:block",
          props.collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent {...props} isMobile={false} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {props.mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={props.onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/40 bg-card md:hidden"
            >
              <SidebarContent {...props} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
