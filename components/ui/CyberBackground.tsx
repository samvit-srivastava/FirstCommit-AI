"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

export function CyberBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleResize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Drifting neural particles (extremely sparse count for 60 FPS performance)
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    const count = 15;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.12,
        speedY: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.25 + 0.05,
      });
    }

    const drawEngine = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 198, ${p.opacity})`;
        ctx.fill();
      });

      // 2. Draw sparse neural meshes (small range threshold)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.035;
            ctx.strokeStyle = `rgba(0, 255, 198, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawEngine);
    };

    drawEngine();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-[#030712]">
      {/* 1. Subtle, slow pulse nebula auroras */}
      <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.04)_0%,rgba(0,0,0,0)_70%)] blur-[140px] pointer-events-none" />
      <div className="absolute -right-[10%] -bottom-[10%] h-[75%] w-[75%] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.03)_0%,rgba(0,0,0,0)_70%)] blur-[120px] pointer-events-none" />

      {/* 2. Extremely subtle cyber grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,16,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(14,16,42,0.06)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_75%,transparent_100%)]" />

      {/* 3. Static noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.007]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. Canvas graphics layer */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />



      {/* 6. Minimal Cursor Spotlight Follow */}
      <motion.div
        className="absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.01)_0%,rgba(0,255,198,0.003)_40%,transparent_70%)] mix-blend-screen"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />
    </div>
  );
}
