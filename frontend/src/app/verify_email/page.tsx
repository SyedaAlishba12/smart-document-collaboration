import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailHandler from "@/components/auth/VerifyEmailHandler";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="One last step"
      title="Verify your email"
      tagline="Confirming your email keeps your workspace secure and your teammates sure it's really you."
    >
      <Suspense fallback={<p className="mt-6 text-sm text-[var(--muted)]">Loading...</p>}>
        <VerifyEmailHandler />
      </Suspense>
    </AuthLayout>
  );
}
