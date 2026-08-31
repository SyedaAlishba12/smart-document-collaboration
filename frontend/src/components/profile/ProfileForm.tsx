"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import api from "@/lib/api_client";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

export default function ProfileForm() {
  const { user, initials, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarError, setAvatarError] = useState(false);
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

  const showImage = avatarUrl.trim().length > 0 && !avatarError;

  return (
    <div className="fade-slide-up overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      {/* Cover banner */}
      <div
        className="ambient-glow relative h-28 w-full"
        style={{
          background:
            "linear-gradient(120deg, var(--primary) 0%, var(--accent) 100%)",
        }}
      />

      <div className="px-6 pb-6">
        {/* Avatar overlapping the banner — this is the live preview of avatar_url */}
        <div className="-mt-10 mb-4 flex items-end gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-[var(--surface)] bg-[var(--primary-soft)] shadow-[var(--shadow-md)]">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
                onLoad={() => setAvatarError(false)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[var(--primary)]">
                {initials}
              </div>
            )}
          </div>
          <div className="pb-1">
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
          <div>
            <Input
              id="avatar_url"
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setAvatarError(false);
              }}
              placeholder="https://..."
            />
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <Camera className="h-3 w-3" />
              {avatarUrl.trim()
                ? avatarError
                  ? "Couldn't load this image — check the link."
                  : "Preview shown above."
                : "Paste an image link to see it appear above."}
            </p>
          </div>

          {status && <Alert variant={status.type} message={status.text} />}

          <Button type="submit" disabled={saving} className="mt-1 w-full sm:w-fit">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
