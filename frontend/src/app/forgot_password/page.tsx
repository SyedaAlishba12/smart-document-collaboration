import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      tagline="No worries — we'll send a reset link to get you back into your workspace."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
