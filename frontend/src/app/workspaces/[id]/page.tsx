"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api_client";
import MemberList from "@/components/workspaces/MemberList";
import type { Workspace } from "@/types/workspace";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/workspaces/${workspaceId}`).then((res) => {
      setWorkspace(res.data);
      setLoading(false);
    });
  }, [workspaceId]);

  if (loading) return <p className="text-sm text-gray-500 p-6">Loading...</p>;
  if (!workspace) return <p className="text-sm text-red-600 p-6">Workspace not found.</p>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">{workspace.name}</h1>
      {workspace.description && <p className="text-gray-500 mb-6">{workspace.description}</p>}

      <h2 className="text-lg font-medium mb-3">Members</h2>
      <MemberList workspaceId={workspace.id} />
    </main>
  );
}
