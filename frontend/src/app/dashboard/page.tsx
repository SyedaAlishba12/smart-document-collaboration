"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Folder,
  LayoutGrid,
  Share2,
  Star,
  Plus,
  ArrowRight,
  Clock3,
  Activity,
  RefreshCw,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";
import RequireAuth from "@/components/auth/RequireAuth";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Alert from "@/components/ui/Alert";

import api from "@/lib/api_client";
import { getApiErrorMessage } from "@/utils/api_error_handler";
import { timeAgo } from "@/utils/date_utils";
import { ROUTES } from "@/constants/routes";

interface DashboardStats {
  my_documents: number;
  shared_with_me: number;
  folders: number;
  workspaces: number;
}

interface DashboardDocument {
  id: string;
  title: string;
  workspace_id: string;
  owner_id: string;
  folder_id?: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface DashboardActivity {
  id: string;
  user_id: string;
  workspace_id: string;
  document_id?: string | null;
  action: string;
  description?: string | null;
  created_at: string;
}

interface DashboardWorkspace {
  id: string;
  name: string;
  description?: string | null;
}

interface DashboardData {
  stats: DashboardStats;
  recent_documents: DashboardDocument[];
  my_documents: DashboardDocument[];
  shared_with_me: DashboardDocument[];
  favorites: DashboardDocument[];
  activity: DashboardActivity[];
  workspaces: DashboardWorkspace[];
}

interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

const statCards = [
  {
    key: "my_documents" as const,
    label: "My Documents",
    icon: FileText,
  },
  {
    key: "shared_with_me" as const,
    label: "Shared With Me",
    icon: Share2,
  },
  {
    key: "folders" as const,
    label: "Folders",
    icon: Folder,
  },
  {
    key: "workspaces" as const,
    label: "Workspaces",
    icon: LayoutGrid,
  },
];

function DocumentItem({
  document,
}: {
  document: DashboardDocument;
}) {
  return (
    <Link
      href={`/documents/${document.id}`}
      className="
        group flex items-center gap-3 rounded-xl
        px-3 py-3
        transition-colors
        hover:bg-[var(--surface-muted)]
      "
    >
      <div
        className="
          flex h-9 w-9 shrink-0 items-center justify-center
          rounded-lg
          bg-[var(--primary-soft)]
          text-[var(--primary)]
        "
      >
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {document.title || "Untitled Document"}
        </p>

        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Updated {timeAgo(document.updated_at)}
        </p>
      </div>

      {document.is_favorite && (
        <Star
          className="h-4 w-4 shrink-0 fill-current text-[var(--warning)]"
          aria-label="Favorite"
        />
      )}

      <ArrowRight
        className="
          h-4 w-4 shrink-0
          text-[var(--muted-light)]
          transition-transform
          group-hover:translate-x-0.5
        "
      />
    </Link>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div
      className="
        flex min-h-[150px]
        flex-col items-center justify-center
        rounded-xl
        border border-dashed border-[var(--border)]
        bg-[var(--surface-muted)]
        px-5 text-center
      "
    >
      <p className="text-sm font-medium text-[var(--foreground)]">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">
        {message}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-9 w-9" />
            <Skeleton className="mt-5 h-7 w-16" />
            <Skeleton className="mt-2 h-4 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />

          <div className="mt-6 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </Card>

        <Card>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />

          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<DashboardResponse>(
        "/api/dashboard"
      );

      setDashboard(response.data.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load your dashboard. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-[1400px]">
          <Header
            eyebrow="Workspace"
            title="Dashboard"
            description="Your workspace overview, recent activity, documents, and collaboration at a glance."
          />

          {loading && <DashboardSkeleton />}

          {!loading && error && (
            <div className="space-y-4">
              <Alert
                title="Dashboard unavailable"
                message={error}
                variant="error"
              />

              <Button
                variant="secondary"
                onClick={fetchDashboard}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && dashboard && (
            <>
              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <Card
                      key={stat.key}
                      hover
                      className="p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-lg
                            bg-[var(--primary-soft)]
                            text-[var(--primary)]
                          "
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <span className="text-[10px] text-[var(--muted-light)]">
                          Overview
                        </span>
                      </div>

                      <p className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                        {dashboard.stats[stat.key]}
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {stat.label}
                      </p>
                    </Card>
                  );
                })}
              </section>

              {/* Quick Actions */}
              <section className="mt-6">
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      Quick Actions
                    </h2>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Start working on a document or organize your workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={ROUTES.DOCUMENTS}>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                        New Document
                      </Button>
                    </Link>

                    <Link href={ROUTES.FOLDERS}>
                      <Button variant="secondary" size="sm">
                        <Folder className="h-4 w-4" />
                        New Folder
                      </Button>
                    </Link>
                  </div>
                </Card>
              </section>

              {/* Recent + Activity */}
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        Recent Documents
                      </h2>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Documents recently updated in your workspaces.
                      </p>
                    </div>

                    <Link
                      href={ROUTES.DOCUMENTS}
                      className="text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="mt-5">
                    {dashboard.recent_documents.length > 0 ? (
                      <div className="space-y-1">
                        {dashboard.recent_documents
                          .slice(0, 6)
                          .map((document) => (
                            <DocumentItem
                              key={document.id}
                              document={document}
                            />
                          ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No recent documents"
                        message="Documents you work on will appear here."
                      />
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        Recent Activity
                      </h2>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Recent collaboration and workspace events.
                      </p>
                    </div>

                    <Activity className="h-4 w-4 text-[var(--muted)]" />
                  </div>

                  <div className="mt-5">
                    {dashboard.activity.length > 0 ? (
                      <div className="space-y-4">
                        {dashboard.activity
                          .slice(0, 6)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3"
                            >
                              <div
                                className="
                                  mt-1 flex h-7 w-7 shrink-0
                                  items-center justify-center
                                  rounded-full
                                  bg-[var(--surface-muted)]
                                  text-[var(--muted)]
                                "
                              >
                                <Clock3 className="h-3.5 w-3.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs leading-5 text-[var(--foreground-secondary)]">
                                  {item.description ||
                                    item.action.replaceAll("_", " ")}
                                </p>

                                <p className="mt-1 text-[10px] text-[var(--muted-light)]">
                                  {timeAgo(item.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No activity yet"
                        message="Workspace activity will appear here as your team works."
                      />
                    )}
                  </div>
                </Card>
              </div>

           {/* My Documents + Shared */}
<div className="mt-6 grid gap-6 xl:grid-cols-2">
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          My Documents
        </h2>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Documents owned by you.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/documents"
          className="text-xs font-medium text-[var(--primary)] hover:underline"
        >
          View all
        </Link>

        <Badge variant="info">
          {dashboard.my_documents.length}
        </Badge>
      </div>
    </div>

    <div className="mt-5">
      {dashboard.my_documents.length > 0 ? (
        <div className="space-y-1">
          {dashboard.my_documents
            .slice(0, 5)
            .map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
              />
            ))}
        </div>
      ) : (
        <EmptyState
          title="No documents yet"
          message="Documents you create will appear in this section."
        />
      )}
    </div>
  </Card>

  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Shared With Me
        </h2>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Documents shared with your account.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/documents/shared"
          className="text-xs font-medium text-[var(--primary)] hover:underline"
        >
          View all
        </Link>

        <Badge variant="default">
          {dashboard.shared_with_me.length}
        </Badge>
      </div>
    </div>

    <div className="mt-5">
      {dashboard.shared_with_me.length > 0 ? (
        <div className="space-y-1">
          {dashboard.shared_with_me
            .slice(0, 5)
            .map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
              />
            ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing shared with you"
          message="Documents shared with you by teammates will appear here."
        />
      )}
    </div>
  </Card>
</div>
              {/* Favorites + Workspaces */}
             {/* Favorites + Workspaces */}
<div className="mt-6 grid gap-6 xl:grid-cols-2">
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Favorites
        </h2>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Your favorite documents.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/documents/favorites"
          className="text-xs font-medium text-[var(--primary)] hover:underline"
        >
          View all
        </Link>

        <Star className="h-4 w-4 text-[var(--warning)]" />
      </div>
    </div>

    <div className="mt-5">
      {dashboard.favorites.length > 0 ? (
        <div className="space-y-1">
          {dashboard.favorites
            .slice(0, 5)
            .map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
              />
            ))}
        </div>
      ) : (
        <EmptyState
          title="No favorites"
          message="Favorite documents will appear here for quick access."
        />
      )}
    </div>
  </Card>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        Workspaces
                      </h2>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Workspaces available to you.
                      </p>
                    </div>

                    <Link
                      href={ROUTES.WORKSPACES}
                      className="text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="mt-5">
                    {dashboard.workspaces.length > 0 ? (
                      <div className="space-y-2">
                        {dashboard.workspaces
                          .slice(0, 5)
                          .map((workspace) => (
                            <Link
                              key={workspace.id}
                              href={`/workspaces/${workspace.id}`}
                              className="
                                block rounded-xl
                                bg-[var(--surface-muted)]
                                p-4
                                transition-colors
                                hover:bg-[var(--primary-soft)]
                              "
                            >
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {workspace.name}
                              </p>

                              {workspace.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                                  {workspace.description}
                                </p>
                              )}
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No workspaces"
                        message="Workspaces you belong to will appear here."
                      />
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </RequireAuth>
  );
}