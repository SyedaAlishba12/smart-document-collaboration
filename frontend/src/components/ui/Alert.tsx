"use client";

import React from "react";

interface AlertProps {
  title?: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
}

const styles = {
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-900",
    icon: "bg-blue-100 text-blue-600",
    symbol: "i",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "bg-emerald-100 text-emerald-600",
    symbol: "✓",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "bg-amber-100 text-amber-600",
    symbol: "!",
  },
  error: {
    container: "border-red-200 bg-red-50 text-red-900",
    icon: "bg-red-100 text-red-600",
    symbol: "×",
  },
};

export default function Alert({
  title,
  message,
  variant = "info",
  onClose,
}: AlertProps) {
  const style = styles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.container}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${style.icon}`}
      >
        {style.symbol}
      </div>

      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}

        <p className={title ? "mt-0.5 text-sm opacity-80" : "text-sm"}>
          {message}
        </p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="rounded-lg p-1 text-current opacity-50 transition hover:bg-black/5 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}