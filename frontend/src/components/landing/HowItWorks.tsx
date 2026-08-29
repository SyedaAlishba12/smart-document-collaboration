"use client";

import { UserPlus, FolderPlus, Users2 } from "lucide-react";
import RevealSection from "./RevealSection";

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in seconds and verify your email to get started.",
  },
  {
    icon: FolderPlus,
    title: "Set up your workspace",
    description: "Create a workspace, add folders, and start your first document.",
  },
  {
    icon: Users2,
    title: "Invite your team",
    description: "Bring in teammates, assign roles, and start collaborating live.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[var(--surface-muted)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <RevealSection className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Getting started
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
            Up and running in three steps
          </h2>
        </RevealSection>

        <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* connecting line, desktop only */}
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-[var(--border)] md:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <RevealSection key={step.title} delay={i * 120} className="relative text-center">
                <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-sm)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-secondary)]">
                  {step.description}
                </p>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
