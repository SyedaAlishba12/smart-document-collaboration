"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProfileForm from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-xl">
          <h1 className="mb-6 text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
            Your profile
          </h1>
          <ProfileForm />
        </div>
      </MainLayout>
    </RequireAuth>
  );
}
