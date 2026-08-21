"use client";

import React, {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
}: DropdownProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        {trigger}
      </div>

      {open && (
        <div
          className={`
            absolute top-full z-40 mt-2
            min-w-48
            overflow-hidden
            rounded-xl
            border border-slate-200
            bg-white
            p-1.5
            shadow-xl
            ${align === "right" ? "right-0" : "left-0"}
          `}
        >
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`
                w-full rounded-lg
                px-3 py-2.5
                text-left text-sm
                transition
                disabled:cursor-not-allowed
                disabled:opacity-40
                ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}