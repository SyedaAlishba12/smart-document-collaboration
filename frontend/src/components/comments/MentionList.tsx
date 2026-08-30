"use client";

import Avatar from "@/components/ui/Avatar";

interface MentionUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface MentionListProps {
  users: MentionUser[];
  onSelect: (user: MentionUser) => void;
}

export default function MentionList({ users, onSelect }: MentionListProps) {
  if (users.length === 0) return null;

  return (
    <div className="absolute z-50 mt-1 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)]">
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Mention someone
      </div>
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--surface-muted)]"
          onClick={() => onSelect(user)}
        >
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          <span className="text-xs font-medium text-[var(--foreground)]">
            {user.name}
          </span>
        </button>
      ))}
    </div>
  );
}