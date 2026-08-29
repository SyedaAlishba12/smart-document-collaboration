"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api_client";
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

  if (loading) return <p className="text-sm text-gray-500">Loading members...</p>;

  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
          <span>
            {m.user_id} <span className="text-gray-400">({m.role})</span>
          </span>
          {m.role !== "owner" && (
            <button onClick={() => handleRemove(m.user_id)} className="text-red-500 hover:underline text-xs">
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
