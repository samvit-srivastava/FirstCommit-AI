import { GitBranch } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border/40 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <GitBranch className="h-4 w-4 text-primary" />
          <span>{APP_NAME}</span>
        </div>

        <p className="text-xs text-muted-foreground/60 sm:text-sm">
          Built for{" "}
          <span className="font-medium text-muted-foreground">
            United Hacks V7
          </span>
        </p>
      </div>
    </footer>
  );
}
