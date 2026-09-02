import api from "@/lib/api_client";
import type { ApiEnvelope, Workspace, WorkspaceMember } from "@/types/workspace";

export async function getWorkspaces(): Promise<Workspace[]> {
  const res = await api.get<ApiEnvelope<Workspace[]>>("/api/workspaces");
  return res.data.data;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const res = await api.get<ApiEnvelope<Workspace>>(`/api/workspaces/${id}`);
  return res.data.data;
}

export async function createWorkspace(payload: { name: string; description?: string }): Promise<Workspace> {
  const res = await api.post<ApiEnvelope<Workspace>>("/api/workspaces", payload);
  return res.data.data;
}

export async function updateWorkspace(id: string, payload: { name?: string; description?: string }): Promise<Workspace> {
  const res = await api.put<ApiEnvelope<Workspace>>(`/api/workspaces/${id}`, payload);
  return res.data.data;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await api.delete(`/api/workspaces/${id}`);
}

export async function getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
  const res = await api.get<ApiEnvelope<WorkspaceMember[]>>(`/api/workspaces/${id}/members`);
  return res.data.data;
}
