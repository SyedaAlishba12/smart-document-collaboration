"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api_client";
import RequireAuth from "@/components/auth/RequireAuth";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import WorkspaceCard from "@/components/workspaces/WorkspaceCard";
import CreateWorkspaceModal from "@/components/workspaces/CreateWorkspaceModal";
import type { ApiEnvelope, Workspace } from "@/types/workspace";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get<ApiEnvelope<Workspace[]>>("/api/workspaces")
      .then((res) => setWorkspaces(res.data.data))
      .catch((err) => setError(err?.response?.data?.message ?? "Could not load workspaces."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">Your workspaces</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">Create and manage the spaces where your team collaborates.</p>
            </div>
            <Button onClick={() => setShowModal(true)}>New workspace</Button>
          </div>

          {error && <Alert variant="error" message={error} />}
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : workspaces.length === 0 ? (
            <div className="fade-slide-up rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-6 py-16 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">No workspaces yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Create your first one to bring your team's documents together.</p>
              <div className="mt-5 flex justify-center"><Button onClick={() => setShowModal(true)}>New workspace</Button></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workspaces.map((w, i) => (
                <div key={w.id} className="card-stagger" style={{ animationDelay: `${i * 60}ms` }}>
                  <WorkspaceCard workspace={w} />
                </div>
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
