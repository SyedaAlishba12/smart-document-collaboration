"use client";

/**
 * /search — global search page.
 *
 * Uses mock data to demonstrate the full search UI layout.
 * TODO: replace MOCK_RESULTS and fetch logic with GET /api/search calls
 * once the backend search service is implemented (pending Document/Folder/
 * User model merge).
 */

import { useState, useDeferredValue, useMemo } from "react";
import SearchInput from "@/components/shared/SearchInput";
import SearchFiltersBar, {
  SearchFilters,
} from "@/components/search/SearchFiltersBar";
import SearchResultCard, {
  SearchResult,
} from "@/components/search/SearchResultCard";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { SearchX } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — remove when wiring to API
// ---------------------------------------------------------------------------

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "1",
    kind: "document",
    title: "Q3 Product Roadmap",
    subtitle: "Product Team workspace",
    fileType: "docx",
    modifiedAt: "2 days ago",
  },
  {
    id: "2",
    kind: "document",
    title: "Engineering Sprint Plan — Aug 2026",
    subtitle: "Engineering workspace",
    fileType: "md",
    modifiedAt: "5 hours ago",
  },
  {
    id: "3",
    kind: "folder",
    title: "Design Assets",
    subtitle: "Design workspace",
    modifiedAt: "1 week ago",
  },
  {
    id: "4",
    kind: "user",
    title: "Sayeel Ahmed",
    subtitle: "sayeel@studiodocs.io",
  },
  {
    id: "5",
    kind: "document",
    title: "Brand Guidelines v2",
    subtitle: "Design workspace",
    fileType: "pdf",
    modifiedAt: "3 days ago",
  },
  {
    id: "6",
    kind: "folder",
    title: "Q3 Deliverables",
    subtitle: "Product Team workspace",
    modifiedAt: "Yesterday",
  },
];

const EMPTY_FILTERS: SearchFilters = {
  resourceKind: "",
  fileType: "",
  workspaceId: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 4;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  // In production this would trigger a debounced fetch to /api/search
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Client-side mock filtering
  const filtered = useMemo(() => {
    const q = deferredQuery.toLowerCase();
    return MOCK_RESULTS.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
      if (filters.resourceKind && r.kind !== filters.resourceKind) return false;
      if (filters.fileType && r.fileType !== filters.fileType) return false;
      return true;
    });
  }, [deferredQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageResults = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilterChange = (next: SearchFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Search
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Find documents, folders, and people.{" "}
            {/* TODO: remove disclaimer when API is live */}
            <span className="italic opacity-60">
              (Mock data — API pending model merge)
            </span>
          </p>
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
        <div className="relative">
          {isStale && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50">
              <Spinner />
            </div>
          )}

          {deferredQuery === "" ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
                <SearchX className="h-7 w-7" />
              </div>
              <p className="text-sm text-[var(--muted)]">
                Type something to search...
              </p>
            </div>
          ) : pageResults.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
                <SearchX className="h-7 w-7" />
              </div>
              <p className="font-medium text-[var(--foreground)]">
                No results for &ldquo;{deferredQuery}&rdquo;
              </p>
              <p className="text-sm text-[var(--muted)]">
                Try different keywords or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-[var(--muted)]">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for{" "}
                <span className="font-medium text-[var(--foreground)]">
                  &ldquo;{deferredQuery}&rdquo;
                </span>
              </p>

              <div className="rounded-2xl border border-[var(--border)] bg-white py-1">
                {pageResults.map((r) => (
                  <SearchResultCard key={r.id} result={r} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
