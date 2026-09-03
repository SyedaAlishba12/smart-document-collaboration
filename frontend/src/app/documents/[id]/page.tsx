"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DocumentRedirectPage() {
  const router = useRouter();
  const params = useParams();

  const documentId = params?.id as string;

  useEffect(() => {
    if (documentId) {
      router.replace(`/editor/${documentId}`);
    }
  }, [documentId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <p className="text-sm text-[var(--muted)]">
        Opening document...
      </p>
    </div>
  );
}