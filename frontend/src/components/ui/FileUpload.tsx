"use client";

import { useRef, useState } from "react";
import { UploadCloud, File, X } from "lucide-react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onChange?: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileUpload({
  label = "Upload files",
  accept,
  multiple = false,
  maxSize,
  onChange,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const processFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setError("");

    const selected = Array.from(selectedFiles);

    if (maxSize) {
      const oversized = selected.find(
        (file) => file.size > maxSize * 1024 * 1024
      );

      if (oversized) {
        setError(
          `${oversized.name} exceeds the ${maxSize}MB size limit.`
        );
        return;
      }
    }

    const newFiles = multiple
      ? [...files, ...selected]
      : selected.slice(0, 1);

    setFiles(newFiles);
    onChange?.(newFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);

    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all
          ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50"
              : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-200">
          <UploadCloud
            size={24}
            className="text-slate-500"
          />
        </div>

        <p className="text-sm font-medium text-slate-700">
          Click to upload
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {multiple
            ? "You can select multiple files"
            : "Select a file from your device"}
        </p>

        {accept && (
          <p className="mt-2 text-xs text-slate-400">
            Accepted: {accept}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <File size={17} className="text-slate-500" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={`Remove ${file.name}`}
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}