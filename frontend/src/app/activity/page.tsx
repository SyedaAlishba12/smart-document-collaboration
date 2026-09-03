"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock3,
  FileText,
  FolderPlus,
  Link2,
  MessageCircle,
  RefreshCw,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
  Upload,
  History,
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

interface ActivityItem {
  id: string;
  user_id?: string;
  workspace_id?: string;
  document_id?: string | null;
  action: string;
  description?: string | null;
  created_at: string;
}

interface ActivityResponse {
  success?: boolean;
  message?: string;
  data?: ActivityItem[];
  activity?: ActivityItem[];
}

interface ParsedActivity {
  title: string;
  description: string;
  documentTitle?: string;
  actor?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBackground: string;
  iconColor: string;
}

/* -------------------------------------------------------------------------- */
/* Activity helpers */
/* -------------------------------------------------------------------------- */

function extractDocumentTitle(description: string): string | undefined {
  const match = description.match(/"([^"]+)"/);

  return match?.[1];
}

function extractUserName(description: string): string | undefined {
  const match = description.match(/^(.+?)\s+(?:granted|changed|updated|removed)/i);

  return match?.[1];
}

function getActivityPresentation(
  activity: ActivityItem
): ParsedActivity {
  const action = activity.action?.toLowerCase() ?? "";
  const description = activity.description?.trim() ?? "";

  const documentTitle = extractDocumentTitle(description);

  if (action.includes("document_created")) {
    return {
      title: "Document created",
      description:
        documentTitle
          ? `Created "${documentTitle}"`
          : description || "A new document was created.",
      documentTitle,
      icon: FileText,
      iconBackground: "bg-[var(--primary-soft)]",
      iconColor: "text-[var(--primary)]",
    };
  }

  if (action.includes("document_updated")) {
    return {
      title: "Document updated",
      description:
        documentTitle
          ? `Updated "${documentTitle}"`
          : description || "A document was updated.",
      documentTitle,
      icon: History,
      iconBackground: "bg-[var(--primary-soft)]",
      iconColor: "text-[var(--primary)]",
    };
  }

  if (action.includes("document_shared")) {
    return {
      title: "Document shared",
      description:
        documentTitle
          ? `Shared "${documentTitle}"`
          : description || "A document was shared.",
      documentTitle,
      icon: Share2,
      iconBackground: "bg-blue-50",
      iconColor: "text-blue-600",
    };
  }

  if (action.includes("permission_changed")) {
    return {
      title: "Permission changed",
      description:
        description || "Document permissions were changed.",
      documentTitle,
      actor: extractUserName(description),
      icon: ShieldCheck,
      iconBackground: "bg-violet-50",
      iconColor: "text-violet-600",
    };
  }

  if (action.includes("comment_created")) {
    return {
      title: "Comment added",
      description:
        documentTitle
          ? `Comment added to "${documentTitle}"`
          : description || "A new comment was added.",
      documentTitle,
      icon: MessageCircle,
      iconBackground: "bg-amber-50",
      iconColor: "text-amber-600",
    };
  }

  if (action.includes("comment_resolved")) {
    return {
      title: "Comment resolved",
      description:
        documentTitle
          ? `Comment resolved in "${documentTitle}"`
          : description || "A comment was resolved.",
      documentTitle,
      icon: CheckCircle2,
      iconBackground: "bg-emerald-50",
      iconColor: "text-emerald-600",
    };
  }

  if (action.includes("file_uploaded")) {
    return {
      title: "File uploaded",
      description:
        description || "A file was uploaded.",
      icon: Upload,
      iconBackground: "bg-cyan-50",
      iconColor: "text-cyan-600",
    };
  }

  if (action.includes("workspace_created")) {
    return {
      title: "Workspace created",
      description:
        description || "A new workspace was created.",
      icon: FolderPlus,
      iconBackground: "bg-orange-50",
      iconColor: "text-orange-600",
    };
  }

  if (action.includes("link_sharing")) {
    return {
      title: "Link sharing updated",
      description:
        documentTitle
          ? `Link sharing updated for "${documentTitle}"`
          : description || "Link sharing settings were updated.",
      documentTitle,
      icon: Link2,
      iconBackground: "bg-indigo-50",
      iconColor: "text-indigo-600",
    };
  }

  if (
    action.includes("member") ||
    action.includes("user") ||
    action.includes("team")
  ) {
    return {
      title: "Team activity",
      description:
        description || "A team or member action occurred.",
      icon: UserPlus,
      iconBackground: "bg-pink-50",
      iconColor: "text-pink-600",
    };
  }

  return {
    title: action
      ? action
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Activity",
    description:
      description || "An activity occurred in your workspace.",
    documentTitle,
    icon: ActivityIcon,
    iconBackground: "bg-[var(--surface-muted)]",
    iconColor: "text-[var(--muted)]",
  };
}

/* -------------------------------------------------------------------------- */
/* Date helpers */
/* -------------------------------------------------------------------------- */

function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const difference =
    startOfToday.getTime() - startOfDate.getTime();

  const oneDay = 24 * 60 * 60 * 1000;

  if (difference === 0) {
    return "Today";
  }

  if (difference === oneDay) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatExactDate(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* -------------------------------------------------------------------------- */
/* Activity item */
/* -------------------------------------------------------------------------- */

function ActivityTimelineItem({
  activity,
  isLast,
}: {
  activity: ActivityItem;
  isLast: boolean;
}) {
  const presentation = getActivityPresentation(activity);
  const Icon = presentation.icon;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}

      {!isLast && (
        <span
          className="
            absolute left-[17px] top-10
            h-[calc(100%+1rem)]
            w-px
            bg-[var(--border)]
          "
        />
      )}

      {/* Icon */}

      <div
        className={`
          relative z-10
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-xl
          ${presentation.iconBackground}
          ${presentation.iconColor}
        `}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {presentation.title}
            </p>

            <p className="mt-1 text-sm leading-6 text-[var(--foreground-secondary)]">
              {presentation.description}
            </p>

            {presentation.actor && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {presentation.actor}
              </p>
            )}

            {presentation.documentTitle && (
              <Link
                href={`/documents/${activity.document_id}`}
                className="
                  mt-2 inline-flex max-w-full
                  items-center gap-1.5
                  rounded-md
                  bg-[var(--surface-muted)]
                  px-2 py-1
                  text-[11px]
                  font-medium
                  text-[var(--muted)]
                  transition
                  hover:bg-[var(--primary-soft)]
                  hover:text-[var(--primary)]
                "
              >
                <FileText className="h-3 w-3 shrink-0" />

                <span className="truncate">
                  {presentation.documentTitle}
                </span>
              </Link>
            )}
          </div>

          <time
            dateTime={activity.created_at}
            title={formatExactDate(activity.created_at)}
            className="
              shrink-0
              text-[10px]
              font-medium
              text-[var(--muted-light)]
            "
          >
            {timeAgo(activity.created_at)}
          </time>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading state */
/* -------------------------------------------------------------------------- */

function ActivitySkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-7">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />

            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state */
/* -------------------------------------------------------------------------- */

function ActivityEmptyState() {
  return (
    <Card className="p-10">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-2xl
            bg-[var(--primary-soft)]
            text-[var(--primary)]
          "
        >
          <ActivityIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
          No activity yet
        </h2>

        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Activity from your documents, workspaces, comments,
          sharing, and team collaboration will appear here.
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page */
/* -------------------------------------------------------------------------- */

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ActivityResponse>(
          "/api/dashboard/activity"
        );

      const data = response.data;

      if (Array.isArray(data)) {
        setActivities(data as ActivityItem[]);
      } else if (Array.isArray(data?.data)) {
        setActivities(data.data);
      } else if (Array.isArray(data?.activity)) {
        setActivities(data.activity);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error("Failed to load activity:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load your activity. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};

    activities.forEach((activity) => {
      const group = getDateGroup(activity.created_at);

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(activity);
    });

    return Object.entries(groups);
  }, [activities]);

  const collaborationCount = useMemo(() => {
    return activities.filter((activity) => {
      const action = activity.action?.toLowerCase() ?? "";

      return (
        action.includes("share") ||
        action.includes("permission") ||
        action.includes("comment") ||
        action.includes("member") ||
        action.includes("team")
      );
    }).length;
  }, [activities]);

  const documentCount = useMemo(() => {
    return activities.filter((activity) => {
      const action = activity.action?.toLowerCase() ?? "";

      return (
        action.includes("document") ||
        action.includes("file")
      );
    }).length;
  }, [activities]);

  return (
    <RequireAuth>
      <MainLayout>
        <div className="mx-auto max-w-[1100px]">
          <Header
            eyebrow="Workspace"
            title="Activity"
            description="A timeline of changes, collaboration, sharing, and workspace events."
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={loadActivity}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            }
          />

          {loading && <ActivitySkeleton />}

          {!loading && error && (
            <div className="space-y-4">
              <Alert
                title="Activity unavailable"
                message={error}
                variant="error"
              />

              <Button
                variant="secondary"
                onClick={loadActivity}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Overview */}

              <section className="grid gap-4 sm:grid-cols-3">
                <Card hover className="p-5">
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
                      <ActivityIcon className="h-4 w-4" />
                    </div>

                    <Badge variant="info">
                      Timeline
                    </Badge>
                  </div>

                  <p className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                    {activities.length}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Total recent events
                  </p>
                </Card>

                <Card hover className="p-5">
                  <div className="flex items-center justify-between">
                    <div
                      className="
                        flex h-9 w-9
                        items-center justify-center
                        rounded-lg
                        bg-blue-50
                        text-blue-600
                      "
                    >
                      <Users className="h-4 w-4" />
                    </div>

                    <Badge variant="default">
                      Collaboration
                    </Badge>
                  </div>

                  <p className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                    {collaborationCount}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Sharing and team events
                  </p>
                </Card>

                <Card hover className="p-5">
                  <div className="flex items-center justify-between">
                    <div
                      className="
                        flex h-9 w-9
                        items-center justify-center
                        rounded-lg
                        bg-emerald-50
                        text-emerald-600
                      "
                    >
                      <FileText className="h-4 w-4" />
                    </div>

                    <Badge variant="success">
                      Documents
                    </Badge>
                  </div>

                  <p className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                    {documentCount}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Document and file events
                  </p>
                </Card>
              </section>

              {/* Timeline */}

              <section className="mt-6">
                {activities.length === 0 ? (
                  <ActivityEmptyState />
                ) : (
                  <Card className="p-6 md:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-[var(--primary)]" />

                          <h2 className="text-sm font-semibold text-[var(--foreground)]">
                            Activity timeline
                          </h2>
                        </div>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          The latest activity across your workspace.
                        </p>
                      </div>

                      <Badge variant="default">
                        {activities.length} events
                      </Badge>
                    </div>

                    <div className="mt-7">
                      {groupedActivities.map(
                        ([group, groupActivities]) => (
                          <div
                            key={group}
                            className="mb-8 last:mb-0"
                          >
                            <div className="mb-5 flex items-center gap-3">
                              <p
                                className="
                                  text-[10px]
                                  font-semibold
                                  uppercase
                                  tracking-[0.16em]
                                  text-[var(--muted-light)]
                                "
                              >
                                {group}
                              </p>

                              <div className="h-px flex-1 bg-[var(--border)]" />
                            </div>

                            <div>
                              {groupActivities.map(
                                (activity, index) => (
                                  <ActivityTimelineItem
                                    key={activity.id}
                                    activity={activity}
                                    isLast={
                                      index ===
                                      groupActivities.length - 1
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                )}
              </section>

              {/* Footer hint */}

              {activities.length > 0 && (
                <div className="mt-5 flex items-center justify-center gap-2 pb-2 text-[10px] text-[var(--muted-light)]">
                  <Clock3 className="h-3 w-3" />
                  Activity is shown from the latest workspace events.
                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </RequireAuth>
  );
}
