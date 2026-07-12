import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { CyberBackground } from "@/components/ui/CyberBackground";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirstCommit AI — Understand Any Repository in Minutes",
  description:
    "AI Developer Onboarding Assistant. Paste a GitHub URL and get an instant project summary, tech stack breakdown, folder explanations, personalized roadmap, and repository-aware chat.",
  keywords: [
    "developer onboarding",
    "GitHub",
    "AI",
    "open source",
    "repository analysis",
  ],
};

import { AnalysisProvider } from "@/lib/AnalysisContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <AnalysisProvider>
            <CyberBackground />
            <CustomCursor />
            {children}
          </AnalysisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
