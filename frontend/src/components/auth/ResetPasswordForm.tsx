"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api_client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/reset_password", { token, new_password: newPassword });
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Alert variant="error" message="Missing or invalid reset token in the URL." />;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Input
        id="new_password"
        type="password"
        label="New password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="At least 8 characters"
      />

      {error && <Alert variant="error" message={error} />}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
