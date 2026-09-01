import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Set a new password"
      tagline="Choose something you'll remember — you'll use it every time you sign back in."
    >
      <Suspense fallback={<p className="mt-6 text-sm text-[var(--muted)]">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
