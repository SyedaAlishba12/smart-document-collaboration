import ProfileForm from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Your profile</h1>
        <ProfileForm />
      </div>
    </main>
  );
}
