"use client";

import React, { ReactNode } from "react";
import Modal from "./Modal";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: "default" | "danger";
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
}: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        {description && (
          <p className="text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}

        {children}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}