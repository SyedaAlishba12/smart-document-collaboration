"use client";

import { Users } from "lucide-react";

interface PresenceIndicatorProps {
  activeCount: number;
  totalUsers?: number;
}

export default function PresenceIndicator({
  activeCount,
  totalUsers,
}: PresenceIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
      <Users className="h-3.5 w-3.5" />
      <span>
        {activeCount} {activeCount === 1 ? "person" : "people"} online
        {totalUsers !== undefined && (
          <span className="text-[var(--muted-light)]">
            {" "}
            / {totalUsers} total
          </span>
        )}
      </span>
    </div>
  );
}