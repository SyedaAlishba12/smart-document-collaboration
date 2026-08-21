import type { TextareaHTMLAttributes } from "react";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
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

      <textarea
        id={id}
        className={`
          min-h-28 w-full resize-y
          rounded-[var(--radius-md)]
          border border-[var(--border)]
          bg-[var(--surface)]
          px-3.5 py-3
          text-sm text-[var(--foreground)]
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