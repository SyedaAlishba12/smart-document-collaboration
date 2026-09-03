"use client";

import {
  GitCommitHorizontal,
  MoreHorizontal,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Dropdown from "@/components/ui/Dropdown";

interface VersionItemProps {
  id: string;

  // Support both frontend camelCase and backend snake_case
  versionNumber?: number;
  version_number?: number;

  author?: string;
  author_name?: string;
  authorAvatar?: string;
  author_avatar?: string;

  createdAt?: string;
  created_at?: string;

  isLatest?: boolean;
  is_latest?: boolean;

  onRestore: () => void;
  onView: () => void;
}

export default function VersionItem({
  id,
  versionNumber,
  version_number,
  author,
  author_name,
  authorAvatar,
  author_avatar,
  createdAt,
  created_at,
  isLatest,
  is_latest,
  onRestore,
  onView,
}: VersionItemProps) {
  const displayVersionNumber =
    versionNumber ?? version_number ?? "?";

  const displayAuthor =
    author ||
    author_name ||
    "User";

  const displayAuthorAvatar =
    authorAvatar ||
    author_avatar;

  const displayCreatedAt =
    createdAt ||
    created_at ||
    "";

  const displayIsLatest =
    isLatest ?? is_latest ?? false;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--muted)]">
        <GitCommitHorizontal className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Version {displayVersionNumber}
          </span>

          {displayIsLatest && (
            <Badge variant="info">
              Latest
            </Badge>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
          <Avatar
            src={displayAuthorAvatar}
            name={displayAuthor}
            size="sm"
            className="h-5 w-5"
          />

          <span>{displayAuthor}</span>

          <span>•</span>

          <span>{displayCreatedAt}</span>
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
