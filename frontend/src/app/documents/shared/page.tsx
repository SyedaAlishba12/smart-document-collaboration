"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Share2 } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import api from "@/lib/api_client";
import { getApiErrorMessage } from "@/utils/api_error_handler";

interface SharedDocument {
  id: string;
  title: string;
  workspace_id?: string | null;
  workspace_name?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  permission_level?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface DashboardResponse {
  success?: boolean;
  message?: string;
  data?: {
    shared_with_me?: SharedDocument[];
  };
  shared_with_me?: SharedDocument[];
}

export default function SharedDocumentsPage() {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<DashboardResponse>("/api/dashboard");

        const payload = response.data;

        const sharedDocuments =
          payload.data?.shared_with_me ??
          payload.shared_with_me ??
          [];

        setDocuments(sharedDocuments);
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load documents shared with you."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDocuments();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Header
          title="Shared with Me"
          description="Documents that other users have shared with your account."
        />

        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <Card>
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-[var(--muted)]">
                Loading shared documents...
              </span>
            </div>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <div className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)]">
                <Share2 className="h-5 w-5 text-[var(--muted)]" />
              </div>

              <h2 className="mt-4 text-base font-semibold">
                Unable to load shared documents
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                {error}
              </p>

              <Button
                className="mt-5"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && documents.length === 0 && (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-muted)]">
                <Share2 className="h-6 w-6 text-[var(--muted)]" />
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                Nothing has been shared with you yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                When someone shares a document with your account,
                it will appear here.
              </p>
            </div>
          </Card>
        )}

        {!loading && !error && documents.length > 0 && (
          <Card>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="font-semibold">
                  Shared Documents
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  {documents.length}{" "}
                  {documents.length === 1
                    ? "document"
                    : "documents"}{" "}
                  shared with you
                </p>
              </div>

              <Badge variant="default">
                {documents.length}
              </Badge>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)]">
                    <FileText className="h-5 w-5 text-[var(--muted)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium group-hover:underline">
                      {document.title || "Untitled Document"}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      {document.workspace_name && (
                        <span>
                          {document.workspace_name}
                        </span>
                      )}

                      {document.owner_name && (
                        <>
                          <span>•</span>
                          <span>
                            Shared by {document.owner_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Badge variant="default">
                      {document.permission_level || "viewer"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

