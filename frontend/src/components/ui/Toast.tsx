"use client";

import React, { useEffect } from "react";

interface ToastProps {
  show: boolean;
  message: string;
  variant?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
  duration?: number;
}

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const icons = {
  success: "✓",
  error: "×",
  info: "i",
  warning: "!",
};

export default function Toast({
  show,
  message,
  variant = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!show || !onClose) return;

    const timer = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timer);
  }, [show, onClose, duration]);

  if (!show) return null;

  return (
    <div
      role="status"
      className={`fixed right-5 top-5 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${styles[variant]}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-semibold">
        {icons[variant]}
      </span>

      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}