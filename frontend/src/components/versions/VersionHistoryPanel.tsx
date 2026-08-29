"use client";

import VersionItem from "./VersionItem";
import { History } from "lucide-react";

interface VersionHistoryPanelProps {
  versions: any[];
  onRestore: (versionId: string) => void;
  onView: (versionId: string) => void;
}

export default function VersionHistoryPanel({
  versions,
  onRestore,
  onView,
}: VersionHistoryPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Version History
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {versions.length} versions saved
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {versions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <History className="h-8 w-8 text-[var(--muted-light)]" />
            <p className="mt-2 text-sm text-[var(--muted)]">
              No versions yet
            </p>
          </div>
        )}

        {versions.map((version) => (
          <VersionItem
            key={version.id}
            {...version}
            onRestore={() => onRestore(version.id)}
            onView={() => onView(version.id)}
          />
        ))}
      </div>
    </div>
  );
}