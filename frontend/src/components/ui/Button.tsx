import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] shadow-sm",

    secondary:
      "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] focus:ring-[var(--primary)]",

    ghost:
      "text-[var(--foreground-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:ring-[var(--primary)]",

    danger:
      "bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",
    md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
    lg: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}