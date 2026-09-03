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
import type { Workspace } from "@/types/workspace";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<Workspace[]>("/api/workspaces");

        setWorkspaces(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            err?.response?.data?.detail ??
            "Could not load workspaces."
        );
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    };

    void loadWorkspaces();
  }, []);

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
                Your workspaces
              </h1>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Create and manage the spaces where your team collaborates.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              New workspace
            </Button>
          </div>

          {error && <Alert variant="error" message={error} />}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="fade-slide-up rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-6 py-16 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No workspaces yet
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Create your first one to bring your team's documents together.
              </p>

              <div className="mt-5 flex justify-center">
                <Button onClick={() => setShowModal(true)}>
                  New workspace
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workspaces.map((workspace, index) => (
                <div
                  key={workspace.id}
                  className="card-stagger"
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <WorkspaceCard workspace={workspace} />
                </div>
              ))}
            </div>
          )}
        </div>

        <CreateWorkspaceModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={(workspace) =>
            setWorkspaces((previous) => [...previous, workspace])
          }
        />
      </MainLayout>
    </RequireAuth>
  );
}