"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api_client";
import RequireAuth from "@/components/auth/RequireAuth";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
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
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
              Your workspaces
            </h1>
            <Button onClick={() => setShowModal(true)}>New workspace</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No workspaces yet. Create your first one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workspaces.map((w) => (
                <WorkspaceCard key={w.id} workspace={w} />
              ))}
            </div>
          )}
        </div>

        <CreateWorkspaceModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={(w) => setWorkspaces((prev) => [...prev, w])}
        />
      </MainLayout>
    </RequireAuth>
  );
}
