"use client";

import DocumentCard, {
  DocumentCardProps,
} from "./DocumentCard";

interface DocumentListProps {
  documents: DocumentCardProps[];
  emptyMessage?: string;
}

export default function DocumentList({
  documents,
  emptyMessage = "No documents found.",
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div
        className="
          rounded-2xl border border-dashed
          border-[var(--border)]
          bg-white px-6 py-12
          text-center
        "
      >
        <p className="text-sm font-medium text-[var(--foreground)]">
          No documents
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {documents.map((document, index) => (
        <DocumentCard
          key={`${document.name}-${index}`}
          {...document}
        />
      ))}
    </div>
  );
}