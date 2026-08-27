"use client";

import { CSSProperties } from "react";

interface CursorOverlayProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

export default function CursorOverlay({
  x,
  y,
  color,
  name,
}: CursorOverlayProps) {
  const style: CSSProperties = {
    left: x,
    top: y,
    backgroundColor: color,
  };

  return (
    <div
      className="pointer-events-none absolute z-30 flex items-start"
      style={style}
    >
      <svg width="18" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 3.21V20.8L8.2 18.1L11.28 23.2L12.5 22.54L9.5 17.42L13.9 17.42L5.5 3.21Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}