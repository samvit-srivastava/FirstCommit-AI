import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
