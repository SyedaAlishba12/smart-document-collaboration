"use client";

/**
 * AccessRow — one row in the "people with access" list inside ShareDialog.
 * Shows: Avatar + name/email, current permission level badge, a dropdown
 * to change or remove access.
 *
 * TODO: replace mock data prop types with the real User shape once the
 * User model is merged and the API is live.
 */

import Avatar from "@/components/ui/Avatar";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import PermissionBadge, {
  PermissionLevel,
} from "@/components/shared/PermissionBadge";
import { ChevronDown } from "lucide-react";

export interface AccessEntry {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  permissionLevel: PermissionLevel;
  isOwner?: boolean;
}

interface AccessRowProps {
  entry: AccessEntry;
  /** Called when the user chooses a new permission level from the dropdown. */
  onChangeLevel: (entryId: string, newLevel: PermissionLevel) => void;
  /** Called when the user removes access for this entry. */
  onRemove: (entryId: string) => void;
}

const LEVELS: PermissionLevel[] = ["Editor", "Commenter", "Viewer"];

export default function AccessRow({
  entry,
  onChangeLevel,
  onRemove,
}: AccessRowProps) {
  const changeItems: DropdownItem[] = LEVELS.filter(
    (l) => l !== entry.permissionLevel
  ).map((l) => ({
    label: l,
    onClick: () => onChangeLevel(entry.id, l),
  }));

  const dropdownItems: DropdownItem[] = [
    ...changeItems,
    {
      label: "Remove access",
      onClick: () => onRemove(entry.id),
      danger: true,
    },
  ];

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar src={entry.avatarUrl} name={entry.name} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {entry.name}
        </p>
        <p className="truncate text-xs text-[var(--muted)]">{entry.email}</p>
      </div>

      {entry.isOwner ? (
        <PermissionBadge permission="Owner" />
      ) : (
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-[var(--surface-muted)]"
              aria-label={`Change permission for ${entry.name}`}
            >
              <PermissionBadge permission={entry.permissionLevel} />
              <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" />
            </button>
          }
          items={dropdownItems}
        />
      )}
    </div>
  );
}
