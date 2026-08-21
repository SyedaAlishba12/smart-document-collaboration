import React from "react";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({
  className = "",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}