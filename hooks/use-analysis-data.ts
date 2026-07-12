"use client";

import { useAnalysis as useRawAnalysis } from "@/lib/AnalysisContext";
import { mapBackendResponseToResult, type AnalyzeBackendResponse } from "@/lib/api";
import { mockAnalysis } from "@/lib/mock-data";
import type { AnalysisResult } from "@/types";

export function useAnalysisData(): {
  data: AnalysisResult;
  repoUrl: string;
  hasRealData: boolean;
} {
  const { analysisResult, repoUrl } = useRawAnalysis();

  if (analysisResult) {
    try {
      const mapped = mapBackendResponseToResult(
        analysisResult as unknown as AnalyzeBackendResponse,
        repoUrl
      );
      return {
        data: mapped,
        repoUrl,
        hasRealData: true,
      };
    } catch (e) {
      console.error("Failed to map backend analysis data, using fallback:", e);
    }
  }

  return {
    data: mockAnalysis,
    repoUrl: "https://github.com/vercel/next.js",
    hasRealData: false,
  };
}
