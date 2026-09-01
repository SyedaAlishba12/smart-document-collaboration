import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      tagline="Bring your team's documents, comments, and edits together in one shared workspace."
    >
      <SignupForm />
    </AuthLayout>
  );
}
