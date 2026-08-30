"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import api from "@/lib/api_client";
import Spinner from "@/components/ui/Spinner";
import type { WorkspaceMember } from "@/types/workspace";

export default function MemberList({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/workspaces/${workspaceId}/members`).then((res) => {
      setMembers(res.data);
      setLoading(false);
    });
  }, [workspaceId]);

  const handleRemove = async (userId: string) => {
    await api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No members yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            {m.role === "owner" && <Crown className="h-3.5 w-3.5 text-[var(--accent)]" />}
            <span className="text-sm text-[var(--foreground)]">{m.user_id}</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--foreground-secondary)]">
              {m.role}
            </span>
          </div>

          {m.role !== "owner" && (
            <button
              type="button"
              onClick={() => handleRemove(m.user_id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remove member"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
