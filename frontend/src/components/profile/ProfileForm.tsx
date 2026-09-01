"use client";

import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import api from "@/lib/api_client";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

export default function ProfileForm() {
  const { user, initials, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setAvatarUrl(user.avatar_url ?? "");
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put("/api/users/me", { full_name: fullName, avatar_url: avatarUrl });
      await refreshUser();
      setStatus({ type: "success", text: "Profile updated." });
    } catch {
      setStatus({ type: "error", text: "Could not update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-lg font-semibold text-[var(--primary)]">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{user?.full_name}</p>
          <p className="text-xs text-[var(--muted)]">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="email" label="Email" value={user?.email ?? ""} disabled />
        <Input
          id="full_name"
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id="avatar_url"
          label="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />

        {status && <Alert variant={status.type} message={status.text} />}

        <Button type="submit" disabled={saving} className="mt-1 w-full sm:w-fit">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
