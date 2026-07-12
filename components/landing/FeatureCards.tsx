"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FEATURES } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";
import { soundManager } from "@/lib/sounds";

const cardVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
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
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setHovered(true);
        soundManager.playHover();
      }}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ 
        y: -6,
        scale: 1.015,
        boxShadow: "0 12px 30px -10px rgba(124, 92, 255, 0.2)",
        borderColor: "rgba(124, 92, 255, 0.35)",
        backgroundColor: "rgba(5, 8, 22, 0.6)"
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="glass bg-white/[0.02] border border-white/10 group relative flex flex-col gap-4 rounded-2xl p-6 overflow-hidden cursor-pointer transition-colors duration-300"
    >
      {/* 
        Subtle Spotlight reflection (reduced opacity by 80%):
        - Faint glow at hover coordinates.
      */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(200px circle at ${coords.x}px ${coords.y}px, rgba(124, 92, 255, 0.025), transparent 80%)`,
        }}
      />

      {/* Subtle icon container */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/5 border border-secondary/15 group-hover:bg-primary/15 group-hover:border-primary/45 transition-all duration-300">
        <motion.div
          animate={{ 
            rotate: hovered ? 12 : 0,
            scale: hovered ? 1.08 : 1
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Icon className="h-5 w-5 text-[#00D4FF] group-hover:text-primary transition-colors" />
        </motion.div>
      </div>

      <div className="z-10">
        <h3 className="text-sm sm:text-base font-heading font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground/75 font-sans">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 pt-4 pb-16 sm:pb-24">
      
      {/* Elegant 1px Divider (gradient fade, zero moving animations) */}
      <div className="mx-auto max-w-4xl h-[1px] mb-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h2 className="text-2xl font-heading font-black tracking-tight sm:text-3xl md:text-4xl">
          Everything You Need to <span className="gradient-text">Get Started</span>
        </h2>
      </motion.div>

      {/* Staggered card layouts */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
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
