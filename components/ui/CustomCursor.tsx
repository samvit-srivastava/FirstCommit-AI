"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);

  // Ultra responsive, dampened spring physics for lag-free performance
  const springConfig = { damping: 35, stiffness: 350, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    const addHoverListeners = () => {
      const targets = document.querySelectorAll(
        "button, a, input, select, textarea, [role='button'], .cursor-pointer"
      );
      targets.forEach((target) => {
        target.addEventListener("mouseenter", () => setHovered(true));
        target.addEventListener("mouseleave", () => setHovered(false));
      });
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Initial attach
    addHoverListeners();

    const observer = new MutationObserver(() => {
      addHoverListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      observer.disconnect();
    };
  }, [cursorX, cursorY, visible]);

  if (typeof window === "undefined" || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-100 hidden md:block">
      {/* 
        Subtle Interactive Cursor Glow:
        - Native cursor remains fully visible.
        - High performance spring follows cursor.
        - Fades in only during hover of interactive elements.
        - Extremely subtle, near-invisible opacity.
      */}
      <motion.div
        className="absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.04)_0%,rgba(0,212,255,0.01)_50%,transparent_75%)] mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: hovered ? 1.2 : 0.6,
          opacity: hovered ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </div>
  );
}
