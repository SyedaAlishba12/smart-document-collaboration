"use client";

/**
 * LinkSharingToggle — controls for enabling/disabling link-based sharing and
 * choosing the link-level permission.
 *
 * TODO: wire onChange handlers to POST /api/documents/{id}/link_sharing
 * once the backend is live.
 */

import Select from "@/components/ui/Select";
import { Link2, Link2Off } from "lucide-react";

interface LinkSharingToggleProps {
  enabled: boolean;
  linkPermissionLevel: "Editor" | "Commenter" | "Viewer";
  onToggle: (enabled: boolean) => void;
  onChangeLinkLevel: (level: "Editor" | "Commenter" | "Viewer") => void;
  shareableLink?: string;
}

export default function LinkSharingToggle({
  enabled,
  linkPermissionLevel,
  onToggle,
  onChangeLinkLevel,
  shareableLink,
}: LinkSharingToggleProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              enabled
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "bg-[var(--surface-muted)] text-[var(--muted)]"
            }`}
          >
            {enabled ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Anyone with the link
            </p>
            <p className="text-xs text-[var(--muted)]">
              {enabled
                ? "Link sharing is active"
                : "Only specific people can access"}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
            enabled ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Link-level select + copy link — only shown when enabled */}
      {enabled && (
        <div className="mt-4 space-y-3">
          <Select
            id="link-permission-level"
            label="Anyone with the link can"
            value={linkPermissionLevel}
            onChange={(e) =>
              onChangeLinkLevel(
                e.target.value as "Editor" | "Commenter" | "Viewer"
              )
            }
            options={[
              { label: "View", value: "Viewer" },
              { label: "Comment", value: "Commenter" },
              { label: "Edit", value: "Editor" },
            ]}
          />

          {shareableLink && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareableLink}
                className="h-9 flex-1 truncate rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs text-[var(--foreground-secondary)] outline-none"
                aria-label="Shareable link"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareableLink)}
                className="h-9 shrink-0 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
