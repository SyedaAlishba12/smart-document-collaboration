"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import api from "@/lib/api_client";
import RequireAuth from "@/components/auth/RequireAuth";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import MemberList from "@/components/workspaces/MemberList";
import AddMemberForm from "@/components/workspaces/AddMemberForm";
import type { Workspace } from "@/types/workspace";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [membersKey, setMembersKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/workspaces/${workspaceId}`)
      .then((res) => {
        setWorkspace(res.data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-2xl">
          {loading && (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {!loading && error && (
            <Alert variant="error" message="Workspace not found." />
          )}

          {!loading && workspace && (
            <>
              <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {workspace.description}
                </p>
              )}

              <Card className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Members</h2>
                </div>

                <MemberList key={membersKey} workspaceId={workspace.id} />

                <div className="mt-5">
                  <AddMemberForm
                    workspaceId={workspace.id}
                    onAdded={() => setMembersKey((k) => k + 1)}
                  />
                </div>
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    </RequireAuth>
  );
}
