"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import api from "@/lib/api_client";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

interface UserResult {
  id: string;
  full_name: string;
  email: string;
}

export default function AddMemberForm({
  workspaceId,
  onAdded,
}: {
  workspaceId: string;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await api.get("/api/users/search", { params: { q: query } });
      setResults(res.data);
    } catch {
      setError("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId: string) => {
    setAdding(userId);
    setError(null);
    try {
      await api.post(`/api/workspaces/${workspaceId}/members`, {
        user_id: userId,
        role: "member",
      });
      setResults((prev) => prev.filter((u) => u.id !== userId));
      onAdded();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Could not add member.");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <Button type="submit" size="sm" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mt-3">
          <Alert variant="error" message={error} />
        </div>
      )}

      {searching && (
        <div className="mt-3 flex justify-center">
          <Spinner size="sm" />
        </div>
      )}

      {!searching && results.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{u.full_name}</p>
                <p className="text-xs text-[var(--muted)]">{u.email}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(u.id)}
                disabled={adding === u.id}
                className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                <UserPlus className="h-3 w-3" />
                {adding === u.id ? "Adding..." : "Add"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
