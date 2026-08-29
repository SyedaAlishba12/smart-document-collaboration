"use client";

import { GitCommitHorizontal, MoreHorizontal, RotateCcw } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Dropdown from "@/components/ui/Dropdown";

interface VersionItemProps {
  id: string;
  versionNumber: number;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  isLatest?: boolean;
  onRestore: () => void;
  onView: () => void;
}

export default function VersionItem({
  id,
  versionNumber,
  author,
  authorAvatar,
  createdAt,
  isLatest = false,
  onRestore,
  onView,
}: VersionItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--muted)]">
        <GitCommitHorizontal className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Version {versionNumber}
          </span>
          {isLatest && <Badge variant="info">Latest</Badge>}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
          <Avatar src={authorAvatar} name={author} size="sm" className="h-5 w-5" />
          <span>{author}</span>
          <span>•</span>
          <span>{createdAt}</span>
        </div>
      </div>

      <Dropdown
        trigger={
          <button className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-muted)]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={[
          {
            label: "View changes",
            onClick: onView,
          },
          {
            label: "Restore this version",
            onClick: onRestore,
          },
        ]}
      />
    </div>
  );
}