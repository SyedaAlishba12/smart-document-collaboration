export type WorkspaceRole = "owner" | "admin" | "member";

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  user: WorkspaceMemberUser;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
