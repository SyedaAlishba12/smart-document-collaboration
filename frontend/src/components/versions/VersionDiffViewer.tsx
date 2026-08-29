"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface VersionDiffViewerProps {
  oldContent?: string;
  newContent?: string;
  onClose: () => void;
}

export default function VersionDiffViewer({
  oldContent,
  newContent,
  onClose,
}: VersionDiffViewerProps) {
  // Placeholder – you can implement a diff algorithm later.
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Comparing versions</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Old</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{oldContent}</pre>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">New</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{newContent}</pre>
        </div>
      </div>
    </div>
  );
}