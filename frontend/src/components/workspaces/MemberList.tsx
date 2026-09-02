"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import api from "@/lib/api_client";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import type { ApiEnvelope, WorkspaceMember } from "@/types/workspace";

export default function MemberList({ workspaceId, refreshKey = 0 }: { workspaceId: string; refreshKey?: number }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<ApiEnvelope<WorkspaceMember[]>>(`/api/workspaces/${workspaceId}/members`);
      setMembers(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not load members.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [workspaceId, refreshKey]);

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      await api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.detail ?? "Could not remove member.");
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;
  if (error) return <Alert variant="error" message={error} />;
  if (members.length === 0) return <p className="text-sm text-[var(--muted)]">No members yet.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
              {m.user.full_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{m.user.full_name}</p>
              <p className="truncate text-xs text-[var(--muted)]">{m.user.email}</p>
            </div>
            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--foreground-secondary)]">{m.role}</span>
            {m.role === "owner" && <Crown className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />}
          </div>
          {m.role !== "owner" && <button type="button" onClick={() => handleRemove(m.user_id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${m.user.full_name}`}><X className="h-3.5 w-3.5" /></button>}
        </li>
      ))}
    </ul>
  );
}
