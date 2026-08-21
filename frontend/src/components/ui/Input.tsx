import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`
          h-10 w-full rounded-[var(--radius-md)]
          border border-[var(--border)]
          bg-[var(--surface)]
          px-3.5 text-sm
          text-[var(--foreground)]
          placeholder:text-[var(--muted-light)]
          outline-none
          transition-all duration-200
          focus:border-[var(--primary)]
          focus:ring-2
          focus:ring-[var(--primary-soft)]
          ${error ? "border-[var(--danger)]" : ""}
          ${className}
        `}
        {...props}
      />

      {error && (
        <span className="text-xs text-[var(--danger)]">
          {error}
        </span>
      )}
    </div>
  );
}