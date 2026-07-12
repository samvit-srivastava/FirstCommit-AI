"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Map, MessageSquare, FolderTree, ArrowRight, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { soundManager } from "@/lib/sounds";

const PRIMARY_ACTION = {
  label: "Analyze New Repository",
  description: "Paste a GitHub URL to power a fresh index",
  icon: Plus,
  href: "/",
};

const SECONDARY_ACTIONS = [
  {
    label: "View Roadmap",
    description: "Personalized onboarding steps",
    icon: Map,
    href: "/dashboard/roadmap",
  },
  {
    label: "Ask AI",
    description: "Chat with the repository AI",
    icon: MessageSquare,
    href: "/dashboard/chat",
  },
  {
    label: "Explore Folders",
    description: "Browse the project structure",
    icon: FolderTree,
    href: "/dashboard/folders",
  },
] as const;

function PrimaryActionCard({ label, description, icon: Icon, href }: {
  label: string;
  description: string;
  icon: typeof Plus;
  href: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={() => {
        soundManager.playClick();
        router.push(href);
      }}
      onMouseEnter={() => {
        setHovered(true);
        soundManager.playHover();
      }}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        borderColor: "rgba(124, 92, 255, 0.4)",
        boxShadow: "0 8px 24px -6px rgba(124, 92, 255, 0.25)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="w-full text-left rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 p-4 transition-all duration-200 relative overflow-hidden group cursor-pointer"
    >
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{
              rotate: hovered ? 90 : 0,
              scale: hovered ? 1.08 : 1
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/30"
          >
            <Icon className="h-4.5 w-4.5 text-primary" />
          </motion.div>
          <div>
            <p className="text-sm font-heading font-black tracking-wide text-foreground uppercase">{label}</p>
            <p className="text-xs text-muted-foreground/60 font-sans mt-0.5 font-medium">{description}</p>
          </div>
        </div>
        <motion.div
          animate={{ x: hovered ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 12 }}
        >
          <ArrowRight className="h-4.5 w-4.5 text-primary" />
        </motion.div>
      </div>
    </motion.button>
  );
}

function SecondaryActionCard({ label, description, icon: Icon, href }: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={() => {
        soundManager.playClick();
        router.push(href);
      }}
      onMouseEnter={() => {
        setHovered(true);
        soundManager.playHover();
      }}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ 
        scale: 1.02, 
        y: -2, 
        borderColor: "rgba(255,255,255,0.15)",
        boxShadow: "0 6px 15px -8px rgba(0, 212, 255, 0.15)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="w-full text-left rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] p-4 transition-all duration-200 flex items-center gap-3 group cursor-pointer"
    >
      <motion.div 
        animate={{
          scale: hovered ? 1.08 : 1,
          rotate: hovered ? 8 : 0,
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/5 group-hover:bg-secondary/20 group-hover:border-secondary/30 transition-all duration-200"
      >
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[#00D4FF] transition-colors" />
      </motion.div>
      <div className="min-w-0">
        <p className="text-[11px] font-heading font-black uppercase tracking-wider text-foreground/90">{label}</p>
        <p className="text-[10px] text-muted-foreground/50 font-sans leading-snug mt-0.5 font-medium">{description}</p>
      </div>
    </motion.button>
  );
}

export function QuickActions() {
  return (
    <Card className="border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl rounded-2xl select-none">
      <CardHeader className="p-6 pb-4 border-b border-white/5">
        <CardTitle className="text-[10px] font-heading font-black uppercase tracking-widest text-foreground/95 flex items-center gap-2.5">
          <Terminal className="h-4.5 w-4.5 text-primary animate-pulse" />
          AI Command Center
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Primary Hero Action */}
        <PrimaryActionCard {...PRIMARY_ACTION} />

        {/* Secondary Action Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {SECONDARY_ACTIONS.map((action) => (
            <SecondaryActionCard key={action.label} {...action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
