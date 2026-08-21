"use client";

import {
  Crown,
  Eye,
  MessageCircle,
  Pencil,
} from "lucide-react";

export type PermissionLevel =
  | "Owner"
  | "Editor"
  | "Commenter"
  | "Viewer";

interface PermissionBadgeProps {
  permission: PermissionLevel;
  compact?: boolean;
}

const permissionConfig = {
  Owner: {
    icon: Crown,
    label: "Owner",
    className: "bg-[#eeeaff] text-[#5b52a3]",
  },
  Editor: {
    icon: Pencil,
    label: "Editor",
    className: "bg-[#eef3ff] text-[#536da6]",
  },
  Commenter: {
    icon: MessageCircle,
    label: "Commenter",
    className: "bg-[#f3eee5] text-[#806d4d]",
  },
  Viewer: {
    icon: Eye,
    label: "Viewer",
    className: "bg-[#f1f1ee] text-[#77746c]",
  },
};

export default function PermissionBadge({
  permission,
  compact = false,
}: PermissionBadgeProps) {
  const config = permissionConfig[permission];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex shrink-0 items-center
        rounded-full font-medium
        ${compact ? "gap-1 px-2 py-1 text-[9px]" : "gap-1.5 px-2.5 py-1 text-[10px]"}
        ${config.className}
      `}
    >
      <Icon
        className={
          compact
            ? "h-2.5 w-2.5"
            : "h-3 w-3"
        }
      />

      {config.label}
    </span>
  );
}