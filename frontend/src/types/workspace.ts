export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
}