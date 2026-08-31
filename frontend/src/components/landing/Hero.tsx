"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import DocumentStackVisual from "@/components/auth/DocumentStackVisual";
import LiquidBackground from "@/components/shared/LiquidBackground";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24">
      <LiquidBackground />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div className="fade-slide-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--foreground-secondary)]">
            <Sparkles className="h-3 w-3 text-[var(--primary)]" />
            Real-time collaboration, built in
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)] sm:text-5xl">
            One workspace for every document your team touches.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--foreground-secondary)]">
            Write, comment, and edit together in real time — with version
            history, permissions, and mentions that just work. No more
            "final_v3_actually_final.docx".
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Log in
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-[var(--muted)]">
            No credit card required. Free for small teams.
          </p>
        </div>

        <div className="fade-slide-up flex justify-center lg:justify-end" style={{ animationDelay: "0.15s" }}>
          <DocumentStackVisual />
        </div>
      </div>
    </section>
  );
}
