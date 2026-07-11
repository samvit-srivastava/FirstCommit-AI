"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Map, MessageSquare, FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  {
    label: "Analyze New Repo",
    description: "Paste another GitHub URL",
    icon: Plus,
    variant: "default" as const,
    href: "/",
  },
  {
    label: "View Roadmap",
    description: "Personalized onboarding steps",
    icon: Map,
    variant: "secondary" as const,
    href: null,
  },
  {
    label: "Ask a Question",
    description: "Chat with the repository AI",
    icon: MessageSquare,
    variant: "secondary" as const,
    href: null,
  },
  {
    label: "Explore Folders",
    description: "Browse the project structure",
    icon: FolderTree,
    variant: "secondary" as const,
    href: null,
  },
] as const;

export function QuickActions() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <Card className="glass border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 pb-5 sm:grid-cols-2">
          {ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto justify-start gap-3 px-3 py-3 text-left"
              onClick={() => {
                if (action.href) router.push(action.href);
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
