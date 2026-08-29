"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api_client";
import WorkspaceCard from "@/components/workspaces/WorkspaceCard";
import CreateWorkspaceModal from "@/components/workspaces/CreateWorkspaceModal";
import type { Workspace } from "@/types/workspace";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/api/workspaces").then((res) => {
      setWorkspaces(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your workspaces</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          New workspace
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-gray-500">No workspaces yet. Create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.map((w) => (
            <WorkspaceCard key={w.id} workspace={w} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateWorkspaceModal
          onClose={() => setShowModal(false)}
          onCreated={(w) => setWorkspaces((prev) => [...prev, w])}
        />
      )}
    </main>
  );
}
