"use client";

/**
 * SearchResultCard — one item in the search results list.
 *
 * Adapts its icon and detail line to the resource kind
 * (document / folder / user).
 *
 * TODO: link href to the real document/folder/user URL once routing is live.
 */

import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { FileText, Folder, User } from "lucide-react";

export interface SearchResult {
  id: string;
  kind: "document" | "folder" | "user";
  title: string;
  subtitle?: string;  // e.g. workspace name or owner email
  fileType?: string;
  modifiedAt?: string;
}

interface SearchResultCardProps {
  result: SearchResult;
}

const KIND_ICON = {
  document: FileText,
  folder: Folder,
  user: User,
};

const KIND_BADGE_VARIANT: Record<
  SearchResult["kind"],
  "default" | "info" | "success"
> = {
  document: "info",
  folder: "success",
  user: "default",
};

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  document: "Document",
  folder: "Folder",
  user: "Person",
};

import Link from "next/link";

export default function SearchResultCard({ result }: SearchResultCardProps) {
  const Icon = KIND_ICON[result.kind];
  
  let href = "#";
  if (result.kind === "document") href = `/editor/${result.id}`;
  else if (result.kind === "folder") href = `/folders/${result.id}`;
  else if (result.kind === "user") href = `/profile/${result.id}`;

  return (
    <Link 
      href={href}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-transparent px-4 py-3 transition hover:border-[var(--border)] hover:bg-white hover:shadow-sm"
    >
      {result.kind === "user" ? (
        <Avatar name={result.title} size="md" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--muted)] transition group-hover:bg-[var(--primary-soft)] group-hover:text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="truncate text-xs text-[var(--muted)]">
            {result.subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {result.fileType && (
          <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {result.fileType}
          </span>
        )}
        <Badge variant={KIND_BADGE_VARIANT[result.kind]}>
          {KIND_LABEL[result.kind]}
        </Badge>
        {result.modifiedAt && (
          <span className="hidden text-xs text-[var(--muted)] sm:block">
            {result.modifiedAt}
          </span>
        )}
      </div>
    </Link>
  );
}
