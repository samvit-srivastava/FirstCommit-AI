"use client";

import { useEffect, useState } from "react";
import { mockAnalysis } from "@/lib/mock-data";
import type { AnalysisResult } from "@/types";

export function useAnalysis() {
  const [data, setData] = useState<AnalysisResult>(mockAnalysis);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("analysisResult");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load analysis from localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading };
}
