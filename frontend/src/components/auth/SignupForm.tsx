"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api_client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { full_name: fullName, email, password });
      router.push("/verify_email");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Input
        id="full_name"
        label="Full name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Ayesha Khan"
      />
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
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />

      {error && <Alert variant="error" message={error} />}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading ? "Creating account..." : "Sign up"}
      </Button>

      <p className="text-center text-sm text-[var(--foreground-secondary)]">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Log in
        </a>
      </p>
    </form>
  );
}
