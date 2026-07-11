"use client";

import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-4 pt-32 pb-12 sm:pt-40 sm:pb-16 md:pt-48 md:pb-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[oklch(0.45_0.18_265_/_12%)] blur-[120px]" />
        <div className="absolute top-[-10%] left-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[oklch(0.5_0.2_300_/_8%)] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>AI-Powered Developer Onboarding</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Understand Any Repository{" "}
          <span className="gradient-text">in Minutes</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
        >
          Paste a GitHub URL. Get an instant project summary, tech stack
          breakdown, folder explanations, personalized onboarding roadmap, and
          AI-powered repository chat.
        </motion.p>
      </motion.div>
    </section>
  );
}
