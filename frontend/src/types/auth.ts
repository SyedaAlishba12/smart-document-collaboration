export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_verified: boolean;
}
