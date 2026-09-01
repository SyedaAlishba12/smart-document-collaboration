"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api_client";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

export default function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error" | "waiting">(
    token ? "pending" : "waiting"
  );

  useEffect(() => {
    if (!token) return;
    api
      .post("/api/auth/verify_email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mt-6">
      {status === "waiting" && <Alert variant="info" message="Check your inbox for a verification link." />}
      {status === "pending" && (
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-[var(--foreground-secondary)]">Verifying your email...</span>
        </div>
      )}
      {status === "success" && (
        <div className="flex flex-col gap-4">
          <Alert
            variant="success"
            title="Email verified"
            message="You can now log in to your account."
          />
          <Link href="/login">
            <Button className="w-full">Log in</Button>
          </Link>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col gap-4">
          <Alert variant="error" title="Verification failed" message="This link is invalid or expired." />
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to log in
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
