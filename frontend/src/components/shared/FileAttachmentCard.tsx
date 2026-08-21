"use client";

import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
} from "lucide-react";

export interface FileAttachmentCardProps {
  name: string;
  size?: string;
  type?: string;
  onDownload?: () => void;
  onAction?: () => void;
}

function getFileIcon(type?: string) {
  const normalized = type?.toLowerCase() || "";

  if (
    normalized.includes("png") ||
    normalized.includes("jpg") ||
    normalized.includes("jpeg")
  ) {
    return FileImage;
  }

  if (
    normalized.includes("xls") ||
    normalized.includes("xlsx") ||
    normalized.includes("csv")
  ) {
    return FileSpreadsheet;
  }

  if (
    normalized.includes("pdf") ||
    normalized.includes("doc")
  ) {
    return FileText;
  }

  return File;
}

export default function FileAttachmentCard({
  name,
  size = "Unknown size",
  type = "File",
  onDownload,
  onAction,
}: FileAttachmentCardProps) {
  const Icon = getFileIcon(type);

  return (
    <div
      className="
        flex min-w-0 items-center gap-3
        rounded-xl border border-[var(--border)]
        bg-white p-3
        transition
        hover:border-[var(--border-strong)]
        hover:bg-[#fdfdfb]
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-lg bg-[#f0eee8]
          text-[#77746c]
        "
      >
        <Icon className="h-[17px] w-[17px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[var(--foreground)]">
          {name}
        </p>

        <p className="mt-1 truncate text-[10px] text-[var(--muted)]">
          {type} · {size}
        </p>
      </div>

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          aria-label={`Download ${name}`}
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            text-[#929087]
            transition
            hover:bg-[#f2f1ed]
            hover:text-[var(--foreground)]
          "
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      )}

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          aria-label={`Actions for ${name}`}
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            text-[#929087]
            transition
            hover:bg-[#f2f1ed]
            hover:text-[var(--foreground)]
          "
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}