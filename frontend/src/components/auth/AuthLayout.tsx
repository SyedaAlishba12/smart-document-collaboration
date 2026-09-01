import { ReactNode } from "react";
import Link from "next/link";
import DocumentStackVisual from "./DocumentStackVisual";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  tagline: string;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, title, tagline, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left: signature visual, hidden on small screens */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--sidebar)] p-12 md:flex">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-white transition hover:text-white/80"
          >
            StudioDocs
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <DocumentStackVisual />
        </div>

        <div className="max-w-xs">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-soft)] opacity-80">
            {eyebrow}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{tagline}</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-[var(--background)] p-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
