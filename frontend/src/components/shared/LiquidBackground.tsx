"use client";

import { useEffect, useRef } from "react";

/**
 * Pure-CSS liquid morphing background: three organic blobs that
 * continuously reshape and drift (via animated border-radius/transform
 * keyframes), plus a subtle mouse-parallax pull. No WebGL/three.js —
 * keeps this dependency-free, matching the rest of the app's stack.
 */
export default function LiquidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={containerRef} className="liquid-blob-container">
      <div className="liquid-blob liquid-blob--one" />
      <div className="liquid-blob liquid-blob--two" />
      <div className="liquid-blob liquid-blob--three" />
    </div>
  );
}
