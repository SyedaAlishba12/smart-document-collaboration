"use client";

import { useState } from "react";
import api from "@/lib/api_client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot_password", { email });
      setMessage(res.data.message ?? "If that email exists, a reset link has been sent.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Input
        id="email"
        type="email"
        label="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />

      {message && <Alert variant="info" message={message} />}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-[var(--foreground-secondary)]">
        Remembered it?{" "}
        <a href="/login" className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Back to log in
        </a>
      </p>
    </form>
  );
}
