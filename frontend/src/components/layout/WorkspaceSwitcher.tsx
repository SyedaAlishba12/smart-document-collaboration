"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Layers3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "@/lib/workspace_api";
import type { Workspace } from "@/types/workspace";

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getWorkspaces().then((items) => {
      setWorkspaces(items);
      const stored = localStorage.getItem("workspace_id");
      const valid = items.some((w) => w.id === stored) ? stored! : items[0]?.id;
      if (valid) { setSelectedId(valid); localStorage.setItem("workspace_id", valid); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = workspaces.find((w) => w.id === selectedId);
  if (loading) return <div className="hidden w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)] lg:block">Loading workspace...</div>;
  if (!selected) return <button type="button" onClick={() => router.push("/workspaces")} className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)] lg:block">Select workspace</button>;

  return (
    <div ref={containerRef} className="relative hidden w-52 lg:block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-left hover:bg-[var(--surface-muted)]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"><Layers3 size={14} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">Workspace</span><span className="block truncate text-xs font-medium text-[var(--foreground)]">{selected.name}</span></span>
        <ChevronDown size={14} className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-md)]">
        {workspaces.map((workspace) => <button key={workspace.id} type="button" onClick={() => { setSelectedId(workspace.id); localStorage.setItem("workspace_id", workspace.id); setOpen(false); router.push(`/workspaces/${workspace.id}`); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left hover:bg-[var(--surface-muted)]">
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--foreground)]">{workspace.name}</span>
          {workspace.id === selectedId && <Check size={15} className="text-[var(--primary)]" />}
        </button>)}
        <div className="mt-1 border-t border-[var(--border)] pt-1"><button type="button" onClick={() => { setOpen(false); router.push("/workspaces"); }} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-[var(--primary)] hover:bg-[var(--surface-muted)]">Manage workspaces</button></div>
      </div>}
    </div>
  );
}
