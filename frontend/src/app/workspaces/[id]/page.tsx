"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Settings, Trash2, Users } from "lucide-react";
import api from "@/lib/api_client";
import RequireAuth from "@/components/auth/RequireAuth";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import MemberList from "@/components/workspaces/MemberList";
import AddMemberForm from "@/components/workspaces/AddMemberForm";
import type { ApiEnvelope, Workspace } from "@/types/workspace";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersKey, setMembersKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiEnvelope<Workspace>>(`/api/workspaces/${workspaceId}`);
      const data = res.data.data;
      setWorkspace(data);
      setName(data.name);
      setDescription(data.description ?? "");
      localStorage.setItem("workspace_id", data.id);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Workspace not found.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSettingsError("Workspace name is required."); return; }
    setSaving(true); setSettingsError(null);
    try {
      const res = await api.put<ApiEnvelope<Workspace>>(`/api/workspaces/${workspaceId}/settings`, {
        name: name.trim(),
        description: description.trim(),
      });
      setWorkspace(res.data.data);
      setSettingsOpen(false);
    } catch (err: any) {
      setSettingsError(err?.response?.data?.message ?? err?.response?.data?.detail ?? "Could not update workspace.");
    } finally { setSaving(false); }
  };

  const deleteCurrentWorkspace = async () => {
    if (!window.confirm("Delete this workspace and its workspace-owned content? This cannot be undone.")) return;
    setDeleting(true); setError(null);
    try {
      await api.delete(`/api/workspaces/${workspaceId}`);
      if (localStorage.getItem("workspace_id") === workspaceId) localStorage.removeItem("workspace_id");
      router.push("/workspaces");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.detail ?? "Could not delete workspace.");
      setDeleting(false);
    }
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-3xl">
          <button type="button" onClick={() => router.push("/workspaces")} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspaces
          </button>

          {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
          {!loading && error && <Alert variant="error" message={error} />}

          {!loading && workspace && (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Workspace</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{workspace.name}</h1>
                  <p className="mt-1 text-sm text-[var(--foreground-secondary)]">{workspace.description || "No description added."}</p>
                </div>
                <Button variant="secondary" onClick={() => setSettingsOpen((v) => !v)}>
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </div>

              {settingsOpen && (
                <Card className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">Workspace settings</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Update the workspace name and description.</p>
                  </div>
                  <form onSubmit={saveSettings} className="flex flex-col gap-4">
                    <Input id="settings_name" label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
                    <Input id="settings_description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
                    {settingsError && <Alert variant="error" message={settingsError} />}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
                    </div>
                  </form>
                  <div className="mt-6 border-t border-[var(--border)] pt-5">
                    <p className="text-xs font-semibold text-red-700">Danger zone</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Delete the workspace and its workspace-owned documents, folders and teams.</p>
                    <Button type="button" variant="danger" className="mt-3" onClick={deleteCurrentWorkspace} disabled={deleting}>
                      <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete workspace"}
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">Members</h2>
                    <p className="text-xs text-[var(--muted)]">People who can access this workspace.</p>
                  </div>
                </div>
                <MemberList workspaceId={workspace.id} refreshKey={membersKey} />
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <AddMemberForm workspaceId={workspace.id} onAdded={() => setMembersKey((k) => k + 1)} />
                </div>
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    </RequireAuth>
  );
}
