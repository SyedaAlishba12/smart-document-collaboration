"use client";

import React from "react";

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
}: ToggleProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "Toggle"}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 items-center
          rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500/30
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? "bg-blue-600" : "bg-gray-300"}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 shrink-0 rounded-full bg-white shadow-sm
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </button>

      {label && (
        <span className="text-sm text-gray-700">
          {label}
        </span>
      )}
    </div>
  );
}