"use client";

/**
 * SearchFilters — filter bar for the global search page.
 * Controls: resource kind (all / documents / folders / users), file type
 * input, workspace selector, date range.
 *
 * TODO: populate workspaceOptions from GET /api/workspaces once that
 * endpoint is live (owned by the workspace team member).
 */

import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

export interface SearchFilters {
  resourceKind: "" | "document" | "folder" | "user";
  fileType: string;
  workspaceId: string;
  dateFrom: string;
  dateTo: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

const KIND_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Documents", value: "document" },
  { label: "Folders", value: "folder" },
  { label: "People", value: "user" },
];

// TODO: replace with real workspace list from API
const WORKSPACE_OPTIONS = [
  { label: "All workspaces", value: "" },
  { label: "Product Team", value: "ws-1" },
  { label: "Engineering", value: "ws-2" },
  { label: "Design", value: "ws-3" },
];

const FILE_TYPE_OPTIONS = [
  { label: "Any file type", value: "" },
  { label: "PDF", value: "pdf" },
  { label: "Word (.docx)", value: "docx" },
  { label: "Spreadsheet (.xlsx)", value: "xlsx" },
  { label: "Presentation (.pptx)", value: "pptx" },
  { label: "Markdown", value: "md" },
];

export default function SearchFiltersBar({
  filters,
  onChange,
  onReset,
}: SearchFiltersProps) {
  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.resourceKind !== "" ||
    filters.fileType !== "" ||
    filters.workspaceId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <Select
            id="filter-kind"
            label="Type"
            value={filters.resourceKind}
            onChange={(e) =>
              set(
                "resourceKind",
                e.target.value as SearchFilters["resourceKind"]
              )
            }
            options={KIND_OPTIONS}
          />
        </div>

        <div className="w-40">
          <Select
            id="filter-workspace"
            label="Workspace"
            value={filters.workspaceId}
            onChange={(e) => set("workspaceId", e.target.value)}
            options={WORKSPACE_OPTIONS}
          />
        </div>

        <div className="w-40">
          <Select
            id="filter-file-type"
            label="File type"
            value={filters.fileType}
            onChange={(e) => set("fileType", e.target.value)}
            options={FILE_TYPE_OPTIONS}
          />
        </div>

        <div className="w-36">
          <Input
            id="filter-date-from"
            label="From"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
          />
        </div>

        <div className="w-36">
          <Input
            id="filter-date-to"
            label="To"
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="mb-0.5 gap-1 text-[var(--danger)]"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
