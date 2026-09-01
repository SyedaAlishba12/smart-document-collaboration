import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your workspace"
      tagline="Every document your team is shaping, all in one place — pick up right where you left off."
    >
      <LoginForm />
    </AuthLayout>
  );
}
