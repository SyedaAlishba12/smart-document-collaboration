"use client";

import Avatar from "@/components/ui/Avatar";

interface ActiveUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  isTyping?: boolean;
}

interface ActiveUsersListProps {
  users: ActiveUser[];
}

export default function ActiveUsersList({ users }: ActiveUsersListProps) {
  return (
    <div className="space-y-3">
      {users.length === 0 && (
        <p className="text-xs text-[var(--muted)]">No one else is here.</p>
      )}

      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size="sm"
            />
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[var(--success)] ring-2 ring-[var(--surface)]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--foreground)]">
              {user.name}
            </p>
            <p className="truncate text-[10px] text-[var(--muted)]">
              {user.isTyping ? "Typing…" : "Active"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}