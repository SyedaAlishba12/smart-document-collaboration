import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export default function Checkbox({
  label,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <label
      className={`flex w-fit cursor-pointer items-center ${className}`}
      style={{
        columnGap: "8px",
      }}
    >
      <input
        {...props}
        type="checkbox"
        className="block h-4 w-4 shrink-0 cursor-pointer"
        style={{
          margin: 0,
          padding: 0,
        }}
      />

      {label && (
        <span
          className="block text-sm text-slate-700"
          style={{
            margin: 0,
            padding: 0,
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}