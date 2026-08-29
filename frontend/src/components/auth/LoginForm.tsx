"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api_client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      sessionStorage.setItem("access_token", res.data.access_token);
      sessionStorage.setItem("refresh_token", res.data.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed. Check your credentials.");
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
      <Input
        id="password"
        type="password"
        label="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && <Alert variant="error" message={error} />}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading ? "Logging in..." : "Log in"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <a href="/forgot_password" className="text-[var(--foreground-secondary)] hover:text-[var(--primary)]">
          Forgot password?
        </a>
        <a href="/signup" className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Create account
        </a>
      </div>
    </form>
  );
}
