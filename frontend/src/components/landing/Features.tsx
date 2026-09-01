"use client";

import { FileEdit, History, MessageSquare, ShieldCheck, Users, Search } from "lucide-react";
import RevealSection from "./RevealSection";

const features = [
  {
    icon: Users,
    title: "Real-time collaboration",
    description: "See who's editing, where their cursor is, and every change as it happens.",
  },
  {
    icon: History,
    title: "Version history",
    description: "Every change is saved. Restore any previous version in one click.",
  },
  {
    icon: MessageSquare,
    title: "Comments & mentions",
    description: "Leave feedback inline, @mention teammates, and resolve threads as you go.",
  },
  {
    icon: ShieldCheck,
    title: "Granular permissions",
    description: "Owner, editor, commenter, or viewer — control exactly who can do what.",
  },
  {
    icon: FileEdit,
    title: "Rich text editor",
    description: "Headings, tables, code blocks, images, and file attachments, all built in.",
  },
  {
    icon: Search,
    title: "Workspace-wide search",
    description: "Find any document, folder, or teammate in seconds with smart filters.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <RevealSection className="mx-auto max-w-xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Everything you need
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
          Built for how teams actually work
        </h2>
      </RevealSection>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <RevealSection key={feature.title} delay={i * 80}>
              <div className="h-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-secondary)]">
                  {feature.description}
                </p>
              </div>
            </RevealSection>
          );
        })}
      </div>
    </section>
  );
}
