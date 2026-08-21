interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export default function Badge({
  children,
  variant = "default",
}: BadgeProps) {
  const variants = {
    default:
      "bg-[var(--surface-muted)] text-[var(--foreground-secondary)]",

    success:
      "bg-[var(--success-soft)] text-[var(--success)]",

    warning:
      "bg-[var(--warning-soft)] text-[var(--warning)]",

    danger:
      "bg-[var(--danger-soft)] text-[var(--danger)]",

    info:
      "bg-[var(--info-soft)] text-[var(--info)]",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-[11px]
        font-medium
        tracking-wide
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}