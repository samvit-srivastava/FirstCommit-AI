"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass group relative flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300 hover:glow-sm"
    >
      <div className="gradient-border flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80">
        <Icon className="h-5 w-5 text-primary transition-colors duration-200 group-hover:text-foreground" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center sm:mb-16"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Everything You Need to{" "}
          <span className="gradient-text">Get Started</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          From project overview to your first commit — all powered by AI.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5"
      >
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </motion.div>
    </section>
  );
}
