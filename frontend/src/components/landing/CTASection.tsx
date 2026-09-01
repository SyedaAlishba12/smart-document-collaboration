"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import RevealSection from "./RevealSection";

export default function CTASection() {
  return (
    <section className="px-6 py-20">
      <RevealSection>
        <div
          className="mx-auto max-w-4xl rounded-[var(--radius-lg)] px-10 py-16 text-center"
          style={{
            background: "var(--sidebar)",
          }}
        >
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-white">
            Bring your team's documents together today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
            Free to start. No credit card needed. Set up your workspace in
            under two minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Create your workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>
    </section>
  );
}
