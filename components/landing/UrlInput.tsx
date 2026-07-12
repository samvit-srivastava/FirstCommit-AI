"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/lib/AnalysisContext";
import { soundManager } from "@/lib/sounds";

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
const ANALYZE_TIMEOUT_MS = 5 * 60 * 1000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Analysis timed out. Large repositories can take several minutes — try again or use a smaller repo."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const SCAN_STEPS = [
  { label: "Repository Connected", freq: 440 },
  { label: "Cloning Repository", freq: 520 },
  { label: "Reading README", freq: 600 },
  { label: "Scanning Files", freq: 680 },
  { label: "Detecting Technologies", freq: 760 },
  { label: "Building Knowledge Graph", freq: 840 },
  { label: "Understanding Architecture", freq: 920 },
  { label: "Generating AI Roadmap", freq: 1000 },
  { label: "Mission Control Ready", freq: 1100 }
];

export function UrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
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

    soundManager.playClick();
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetchWithTimeout(
        `${apiUrl}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repo_url: url.trim() }),
        },
        ANALYZE_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze repository.");
      }

      const data = await response.json();

      setIsScanning(true);
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setScanStep(i);
        soundManager.playScanChirp(SCAN_STEPS[i].freq, 0.08);
        await new Promise((resolve) => setTimeout(resolve, 750));
      }

      soundManager.playSuccess();
      setAnalysis(data, url.trim());
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      const message = error.message || "An error occurred while connecting to the backend.";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setError("Cannot reach the analysis backend. Make sure the API server is running on port 8000.");
      } else {
        setError(message);
      }
      setIsScanning(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#030712]/95 backdrop-blur-2xl px-4">
        {/* Futuristic Terminal Scan Display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg p-6 rounded-2xl glass border-primary/30 glow relative overflow-hidden font-mono shadow-2xl"
        >
          <div className="absolute top-0 left-0 h-[1.5px] w-full bg-[linear-gradient(90deg,transparent,#7C5CFF,#00D4FF,#00FFC6,transparent)]" />
          
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4 text-xs text-[#00FFC6]/65">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00FFC6] animate-ping shrink-0" />
              INTELLIGENCE_SCANNING: ON
            </span>
            <span>OS_STABILITY: 100%</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            {SCAN_STEPS.map((step, idx) => {
              const isPast = idx < scanStep;
              const isActive = idx === scanStep;
              return (
                <div
                  key={step.label}
                  className={`flex items-center justify-between transition-all duration-200 ${
                    isActive ? "text-[#00FFC6] font-bold scale-[1.02]" : isPast ? "text-primary/70" : "text-muted-foreground/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{isPast ? "[✓]" : isActive ? "[▶]" : "[ ]"}</span>
                    <span>{step.label}</span>
                  </span>
                  {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00FFC6]" />}
                </div>
              );
            })}
          </div>

          {/* Progress Bar HUD */}
          <div className="mt-6 border-t border-border/40 pt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>SCANNING COMPLETED METRIC</span>
              <span className="font-mono">{Math.round(((scanStep + 1) / SCAN_STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[linear-gradient(90deg,#7C5CFF,#00D4FF,#00FFC6)]"
                initial={{ width: 0 }}
                animate={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="relative z-10 mx-auto w-full max-w-2xl px-4"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative z-10">
        {/* Premium Static Glass Input with Subtle Border Focus & Hover shadows */}
        <div className="glass bg-[#050816]/75 border border-border/60 rounded-2xl p-1.5 focus-within:border-primary/45 hover:border-border transition-all duration-300 shadow-md">
          <div className="flex items-center gap-3 px-3 py-1.5">
            <GitHubIcon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) validate(e.target.value);
              }}
              onFocus={() => soundManager.playHover()}
              placeholder="https://github.com/owner/repository"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-base font-mono"
              aria-label="GitHub repository URL"
              aria-describedby={error ? "url-error" : undefined}
              aria-invalid={!!error}
              disabled={isLoading}
            />
            
            {/* Signature Wow scan button tap physics */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                onMouseEnter={() => soundManager.playHover()}
                className="shrink-0 cursor-pointer gap-2 rounded-xl bg-primary hover:brightness-110 transition-all duration-150 text-white font-heading font-black uppercase tracking-wider text-xs px-5 py-2.5 border border-primary/30 hover:shadow-[0_0_20px_rgba(124,92,255,0.4)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Indexing…</span>
                  </>
                ) : (
                  <>
                    <span>Power Scan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {error && (
          <motion.p
            id="url-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="pl-1 text-xs text-destructive font-mono"
          >
            {error}
          </motion.p>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground/50 font-mono">
        Try with{" "}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setUrl("https://github.com/vercel/next.js");
            setError("");
          }}
          onMouseEnter={() => soundManager.playHover()}
          className="cursor-pointer text-primary underline decoration-primary/30 underline-offset-2 hover:text-[#00FFC6] transition-colors"
        >
          vercel/next.js
        </button>{" "}
        or any public repository
      </p>
    </motion.div>
  );
}
