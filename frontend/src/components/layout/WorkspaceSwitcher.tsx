"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Layers3 } from "lucide-react";

export interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  selectedWorkspaceId?: string;
  onChange?: (workspace: Workspace) => void;
  disabled?: boolean;
}

export default function WorkspaceSwitcher({
  workspaces,
  selectedWorkspaceId,
  onChange,
  disabled = false,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedWorkspace =
    workspaces.find(
      (workspace) => workspace.id === selectedWorkspaceId
    ) ?? workspaces[0];

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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (workspace: Workspace) => {
    onChange?.(workspace);
    setOpen(false);
  };

  if (!selectedWorkspace) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--muted)]">
        No workspaces
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="
          flex w-full items-center gap-3
          rounded-xl border border-[var(--border)]
          bg-[var(--surface)]
          px-3 py-2.5
          text-left
          transition
          hover:border-[var(--border-strong)]
          hover:bg-[var(--surface-muted)]
          focus:outline-none
          focus:ring-2
          focus:ring-[var(--primary)]/20
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <span
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            bg-[var(--primary-soft)]
            text-[var(--primary)]
          "
        >
          <Layers3 size={16} strokeWidth={1.8} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs text-[var(--muted)]">
            Workspace
          </span>

          <span className="block truncate text-sm font-medium text-[var(--foreground)]">
            {selectedWorkspace.name}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`
            shrink-0 text-[var(--muted)]
            transition-transform duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 right-0 top-full z-50 mt-2
            overflow-hidden
            rounded-xl
            border border-[var(--border)]
            bg-[var(--surface)]
            p-1.5
            shadow-[0_12px_35px_rgba(0,0,0,0.10)]
          "
        >
          <div className="px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-light)]">
              Workspaces
            </p>
          </div>

          <div className="space-y-0.5">
            {workspaces.map((workspace) => {
              const isSelected =
                workspace.id === selectedWorkspace.id;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => handleSelect(workspace)}
                  className={`
                    flex w-full items-center gap-3
                    rounded-lg
                    px-2.5 py-2.5
                    text-left
                    transition
                    ${
                      isSelected
                        ? "bg-[var(--primary-soft)]"
                        : "hover:bg-[var(--surface-muted)]"
                    }
                  `}
                >
                  <span
                    className="
                      flex h-7 w-7 shrink-0
                      items-center justify-center
                      rounded-md
                      bg-[var(--surface-muted)]
                      text-[var(--muted)]
                    "
                  >
                    <Layers3 size={14} strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                    {workspace.name}
                  </span>

                  {isSelected && (
                    <Check
                      size={16}
                      className="shrink-0 text-[var(--primary)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}