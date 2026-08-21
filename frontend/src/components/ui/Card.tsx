import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export default function Card({
  children,
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-lg)]
        border border-[var(--border)]
        bg-[var(--surface)]
        p-5
        shadow-[var(--shadow-sm)]
        ${hover
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
          : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}