"use client";

import RevealSection from "./RevealSection";

const stats = [
  { value: "10x", label: "Faster document reviews" },
  { value: "0", label: "Lost edits with version history" },
  { value: "100%", label: "Team visibility, in real time" },
];

export default function SocialProof() {
  return (
    <section id="why-us" className="mx-auto max-w-6xl px-6 py-24">
      <RevealSection className="mx-auto max-w-xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Why teams switch
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
          Stop losing track of who changed what
        </h2>
      </RevealSection>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <RevealSection key={stat.label} delay={i * 100}>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-4xl font-semibold tracking-[-0.03em] text-[var(--primary)]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-[var(--foreground-secondary)]">{stat.label}</p>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}
