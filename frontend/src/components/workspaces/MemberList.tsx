"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";

import api from "@/lib/api_client";

import Spinner from "@/components/ui/Spinner";

import type { WorkspaceMember } from "@/types/workspace";

interface MemberListProps {
  workspaceId: string;
  refreshKey?: number;
}

export default function MemberList({
  workspaceId,
  refreshKey = 0,
}: MemberListProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);

      try {
        const res = await api.get<WorkspaceMember[]>(
          `/api/workspaces/${workspaceId}/members`
        );

        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    void loadMembers();
  }, [workspaceId, refreshKey]);

  const handleRemove = async (userId: string) => {
    try {
      await api.delete(
        `/api/workspaces/${workspaceId}/members/${userId}`
      );

      setMembers((previous) =>
        previous.filter((member) => member.user_id !== userId)
      );
    } catch {
      // Keep the existing list unchanged if removal fails.
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No members yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            {member.role === "owner" && (
              <Crown className="h-3.5 w-3.5 text-[var(--accent)]" />
            )}

            <span className="text-sm text-[var(--foreground)]">
              {member.user_id}
            </span>

            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--foreground-secondary)]">
              {member.role}
            </span>
          </div>

          {member.role !== "owner" && (
            <button
              type="button"
              onClick={() => handleRemove(member.user_id)}
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