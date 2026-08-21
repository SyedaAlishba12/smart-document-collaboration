"use client";

import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";

import {
  FileText,
  Folder,
  LayoutGrid,
  Share2,
} from "lucide-react";

const dashboardStats = [
  {
    label: "My Documents",
    value: "—",
    icon: FileText,
  },
  {
    label: "Shared With Me",
    value: "—",
    icon: Share2,
  },
  {
    label: "Folders",
    value: "—",
    icon: Folder,
  },
  {
    label: "Workspaces",
    value: "—",
    icon: LayoutGrid,
  },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">

        <Header
          eyebrow="Workspace"
          title="Dashboard"
          description="Your workspace overview, recent activity, documents, and collaboration at a glance."
        />

        {/* Overview */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="
                  rounded-2xl
                  border border-[var(--border)]
                  bg-[var(--surface)]
                  p-5
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-[var(--shadow-sm)]
                "
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
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </section>

        {/* Main dashboard areas */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          {/* Documents */}

          <section
            className="
              min-h-[260px]
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              p-6
            "
          >
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Recent Documents
            </h2>

            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Documents from the current workspace will appear here once
              the document module is connected.
            </p>

            <div
              className="
                mt-8
                flex min-h-[130px]
                items-center justify-center
                rounded-xl
                border border-dashed border-[var(--border)]
                bg-[var(--surface-muted)]
              "
            >
              <p className="text-xs text-[var(--muted)]">
                Document data will be connected here.
              </p>
            </div>
          </section>

          {/* Activity */}

          <section
            className="
              min-h-[260px]
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              p-6
            "
          >
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Recent Activity
            </h2>

            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Collaboration and workspace activity will appear here once
              the relevant modules are connected.
            </p>

            <div
              className="
                mt-8
                flex min-h-[130px]
                items-center justify-center
                rounded-xl
                border border-dashed border-[var(--border)]
                bg-[var(--surface-muted)]
              "
            >
              <p className="text-xs text-[var(--muted)]">
                Activity data will be connected here.
              </p>
            </div>
          </section>

        </div>

        {/* Shared application shell */}

        <section
          className="
            mt-6
            rounded-2xl
            border border-[var(--border)]
            bg-[var(--surface)]
            p-6
          "
        >
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Workspace Overview
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)]">
            This dashboard is the shared application shell. Team members
            can connect their assigned modules, APIs, and components here
            without changing the global layout.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Shared Layout
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Sidebar, navbar and page structure.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Shared Components
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Reusable UI components are ready.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Module Integration
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Team modules can be added independently.
              </p>
            </div>

          </div>
        </section>

      </div>
    </MainLayout>
  );
}