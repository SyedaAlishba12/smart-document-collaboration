"use client";

/**
 * /share — demo page for the ShareDialog component.
 *
 * In production this dialog will be rendered inline on the document editor
 * page via a "Share" button, not as a standalone route.  This standalone
 * route exists only for isolated UI development and design review.
 *
 * TODO: remove this page or redirect it once the dialog is wired into the
 * document editor.
 */

import { useState } from "react";
import Button from "@/components/ui/Button";
import ShareDialog from "@/components/sharing/ShareDialog";
import { Share2 } from "lucide-react";

export default function ShareDemoPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Share Dialog — Preview
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Mock data only — wire to <code>/api/documents/{`{id}`}/share</code>{" "}
          once the backend is live.
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Open Share Dialog
      </Button>

      <ShareDialog
        open={open}
        onClose={() => setOpen(false)}
        documentName="Q3 Product Roadmap"
        documentId="demo-doc-001"
      />
    </main>
  );
}
