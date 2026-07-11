"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/;

import { useAnalysis } from "@/lib/AnalysisContext";

export function UrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setAnalysis } = useAnalysis();

  function validate(value: string): boolean {
    if (!value.trim()) {
      setError("Please enter a GitHub repository URL.");
      return false;
    }
    if (!GITHUB_URL_PATTERN.test(value.trim())) {
      setError("Enter a valid GitHub URL (https://github.com/owner/repo).");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate(url)) return;

    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze repository.");
      }

      const data = await response.json();
      setAnalysis(data, url.trim());
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while connecting to the backend.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="relative z-10 mx-auto w-full max-w-2xl px-4"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="glass glow-sm flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-300 focus-within:glow">
          <GitHubIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) validate(e.target.value);
            }}
            placeholder="https://github.com/owner/repository"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-base"
            aria-label="GitHub repository URL"
            aria-describedby={error ? "url-error" : undefined}
            aria-invalid={!!error}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="shrink-0 cursor-pointer gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-60 sm:px-5 sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing…</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <motion.p
            id="url-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="pl-1 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground/60 sm:text-sm">
        Try with{" "}
        <button
          type="button"
          onClick={() => {
            setUrl("https://github.com/vercel/next.js");
            setError("");
          }}
          className="cursor-pointer text-primary/80 underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary"
        >
          vercel/next.js
        </button>{" "}
        or any public repository
      </p>
    </motion.div>
  );
}
