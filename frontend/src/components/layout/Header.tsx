import { ReactNode } from "react";

interface HeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function Header({
  eyebrow,
  title,
  description,
  actions,
}: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">

      <div className="min-w-0">

        {eyebrow && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)] md:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}