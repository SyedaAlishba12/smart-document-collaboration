"use client";

import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";
import ActiveUsersList from "@/components/collaboration/ActiveUsersList";
import { Users } from "lucide-react";

export default function CollaborationPage() {
  const users = [
    { id: "1", name: "Syeda Alishba", isOnline: true },
    { id: "2", name: "Fatima Khalid", isOnline: false },
    { id: "3", name: "Zainab Bibi", isOnline: true, isTyping: true },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1200px]">
        <Header
          eyebrow="Realtime"
          title="Collaboration"
          description="See who is active across documents."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold">Active Documents</h2>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Document collaboration activity will appear here.
            </p>
            {/* Empty state */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-10">
              <Users className="h-8 w-8 text-[var(--muted-light)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">
                No one is editing right now.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold">Currently Online</h2>
            <div className="mt-4">
              <ActiveUsersList users={users} />
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}