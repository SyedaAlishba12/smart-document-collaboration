import type { SelectHTMLAttributes } from "react";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    label: string;
    value: string;
  }[];
}

export default function Select({
  label,
  error,
  options,
  id,
  className = "",
  ...props
}: SelectProps) {
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

      <select
        id={id}
        className={`
          h-10 w-full
          rounded-[var(--radius-md)]
          border border-[var(--border)]
          bg-[var(--surface)]
          px-3.5
          text-sm text-[var(--foreground)]
          outline-none
          transition-all duration-200
          focus:border-[var(--primary)]
          focus:ring-2
          focus:ring-[var(--primary-soft)]
          ${error ? "border-[var(--danger)]" : ""}
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-[var(--danger)]">
          {error}
        </span>
      )}
    </div>
  );
}