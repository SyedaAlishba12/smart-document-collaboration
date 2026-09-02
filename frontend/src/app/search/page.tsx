"use client";

/**
 * /search — global search page.
 *
 * Fetches live data from GET /api/search with:
 *   - Debounced query input
 *   - Workspace, file type, date, and resource kind filters
 *   - Server-side pagination
 */

import { useState, useEffect, useCallback, useRef } from "react";
import SearchInput from "@/components/shared/SearchInput";
import SearchFiltersBar, {
  SearchFilters,
} from "@/components/search/SearchFiltersBar";
import SearchResultCard, {
  SearchResult,
} from "@/components/search/SearchResultCard";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { SearchX, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearch, SearchResultItem } from "@/lib/search_api";

const EMPTY_FILTERS: SearchFilters = {
  resourceKind: "",
  fileType: "",
  workspaceId: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 10;

// Map API result item to the shape SearchResultCard expects
function toSearchResult(item: SearchResultItem): SearchResult {
  return {
    id: item.id,
    kind: item.kind as "document" | "folder" | "user",
    title: item.title,
    subtitle: item.workspace_id ?? (item.kind === "user" ? "" : ""),
    fileType: item.file_type ?? undefined,
    modifiedAt: item.modified_at
      ? new Date(item.modified_at).toLocaleDateString()
      : undefined,
  };
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch results from API
  // ---------------------------------------------------------------------------
  const fetchResults = useCallback(
    async (q: string, f: SearchFilters, p: number) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await globalSearch({
          query: q,
          workspace_id: f.workspaceId || undefined,
          file_type: f.fileType || undefined,
          resource_kind: (f.resourceKind as any) || undefined,
          date_from: f.dateFrom || undefined,
          date_to: f.dateTo || undefined,
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        });
        if (res.success && res.data) {
          setResults(res.data.items.map(toSearchResult));
          setTotal(res.data.total);
        } else {
          setResults([]);
          setTotal(0);
        }
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced effect — fires 350ms after the query or filters change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, filters, page);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, page, fetchResults]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilterChange = (next: SearchFilters) => {
    setFilters(next);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Page heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--muted)] transition hover:bg-gray-50 hover:text-[var(--foreground)]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Search</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Find documents, folders, and people across your workspace.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <SearchInput
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onClear={() => handleQueryChange("")}
          placeholder="Search documents, folders, people..."
        />

        {/* Filters */}
        <SearchFiltersBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />

        {/* Results */}
        <div className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70">
              <Spinner />
            </div>
          )}

          {!hasSearched && !loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
                <SearchX className="h-7 w-7" />
              </div>
              <p className="text-sm text-[var(--muted)]">
                Type something to search...
              </p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
                <SearchX className="h-7 w-7" />
              </div>
              <p className="font-medium text-[var(--foreground)]">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-sm text-[var(--muted)]">
                Try different keywords or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {!loading && (
                <p className="text-xs text-[var(--muted)]">
                  {total} result{total !== 1 ? "s" : ""} for{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    &ldquo;{query}&rdquo;
                  </span>
                </p>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-white py-1">
                {results.map((r) => (
                  <SearchResultCard key={r.id} result={r} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
