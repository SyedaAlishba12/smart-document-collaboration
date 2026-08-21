"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function DatePicker({
  label,
  value = "",
  onChange,
  placeholder = "Select a date",
  disabled = false,
  error,
}: DatePickerProps) {
  const [date, setDate] = useState(value);

  const handleChange = (newValue: string) => {
    setDate(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <CalendarDays
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all
            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            }
            ${
              disabled
                ? "cursor-not-allowed bg-slate-50 text-slate-400"
                : "hover:border-slate-300"
            }
          `}
          aria-label={placeholder}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}