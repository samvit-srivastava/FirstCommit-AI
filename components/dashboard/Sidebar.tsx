"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
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
import { soundManager } from "@/lib/sounds";
import { useState } from "react";

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col relative z-10 font-sans select-none">
      {/* Sidebar Brand Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-white/5 px-4",
          collapsed && !isMobile ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-sm font-heading font-black uppercase tracking-wider text-foreground">
            {APP_NAME}
          </span>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1.5 px-3 py-5" aria-label="Dashboard navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isHovered = hoveredItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundManager.playClick();
                onSectionChange(item.id);
              }}
              onMouseEnter={() => {
                setHoveredItem(item.id);
                soundManager.playHover();
              }}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer relative group",
                collapsed && !isMobile ? "justify-center px-2" : "",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/50 hover:bg-white/[0.02] hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              {/* Premium Shared Layout Left Active Indicator Beam */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-md bg-primary shadow-[0_0_8px_rgba(124,92,255,0.7)]"
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                />
              )}

              {/* Subtle hover icon rotation */}
              <motion.div
                animate={{
                  rotate: isHovered ? 8 : 0,
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.15 }}
                className="shrink-0"
              >
                <item.icon className="h-4 w-4" />
              </motion.div>

              {(!collapsed || isMobile) && (
                <motion.span
                  animate={{ x: isHovered ? 2 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Action Footer */}
      {!isMobile && (
        <div className="border-t border-white/5 p-2 bg-black/10">
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleCollapse();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 transition-colors hover:bg-white/5 hover:text-foreground cursor-pointer"
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
      {/* Floating Desktop sidebar */}
      <aside
        className={cn(
          "hidden my-4 ml-4 h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl transition-all duration-200 md:block overflow-hidden relative",
          props.collapsed ? "w-16" : "w-52"
        )}
      >
        <SidebarContent {...props} isMobile={false} />
      </aside>

      {/* Floating Mobile drawer */}
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
              className="fixed inset-y-4 left-4 z-50 w-64 rounded-2xl border border-white/10 bg-[#030712]/92 backdrop-blur-xl md:hidden overflow-hidden"
            >
              <SidebarContent {...props} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
