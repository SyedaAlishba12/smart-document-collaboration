"use client";

import {
  Activity,
  Bell,
  FileText,
  Folder,
  HelpCircle,
  Home,
  LayoutGrid,
  Search,
  Settings,
  Share2,
  Star,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  collapsed?: boolean;
}

const workspaceNavigation = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "My Documents",
    icon: FileText,
    href: "/documents",
  },
  {
    label: "Folders",
    icon: Folder,
    href: "/folders",
  },
  {
    label: "Workspaces",
    icon: LayoutGrid,
    href: "/workspaces",
  },
];

const collaborationNavigation = [
  {
    label: "Shared with Me",
    icon: Share2,
    href: "/documents/shared",
  },
  {
    label: "Favorites",
    icon: Star,
    href: "/documents/favorites",
  },
  {
    label: "Activity",
    icon: Activity,
    href: "/activity",
  },
];

interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export default function Sidebar({
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, initials } = useAuth();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        hidden lg:flex
        flex-col
        border-r border-[var(--border)]
        bg-[#f4f3ef]
        transition-all duration-300
        ${collapsed ? "w-[76px]" : "w-[238px]"}
      `}
    >
      {/* Brand */}

      <div
        className={`
          flex h-[72px] shrink-0
          items-center
          border-b border-[var(--border)]
          ${collapsed ? "justify-center px-3" : "px-5"}
        `}
      >
        <div className="flex items-center gap-3">

          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
              bg-[var(--primary)]
              text-sm font-bold text-white
              shadow-sm
            "
          >
            SD
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
                StudioDocs
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Collaboration
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Search */}

      {!collapsed && (
        <div className="px-4 pt-5">
          <button
            type="button"
            className="
              flex w-full items-center gap-2.5
              rounded-xl
              border border-[var(--border)]
              bg-white/70
              px-3 py-2.5
              text-left
              transition
              hover:border-[var(--border-strong)]
              hover:bg-white
            "
          >
            <Search className="h-4 w-4 text-[#929087]" />

            <span className="flex-1 text-xs text-[#858279]">
              Search
            </span>

            <span
              className="
                rounded-md
                border border-[var(--border)]
                bg-[#f7f6f2]
                px-1.5 py-0.5
                text-[9px]
                font-medium
                text-[#aaa79f]
              "
            >
              /
            </span>
          </button>
        </div>
      )}

      {/* Navigation */}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6">

        <NavigationSection
          title="Workspace"
          items={workspaceNavigation}
          collapsed={collapsed}
          pathname={pathname}
        />

        <NavigationSection
          title="Collaboration"
          items={collaborationNavigation}
          collapsed={collapsed}
          pathname={pathname}
        />

      </div>

      {/* Bottom */}

      <div className="shrink-0 border-t border-[var(--border)] p-3">

        <SidebarItem
          icon={Bell}
          label="Notifications"
          collapsed={collapsed}
        />

        <SidebarItem
          icon={HelpCircle}
          label="Help & Shortcuts"
          collapsed={collapsed}
        />

        <SidebarItem
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
        />

        {/* User */}

        <div
          className={`
            mt-2 flex items-center rounded-xl
            ${collapsed ? "justify-center p-2" : "gap-3 px-2.5 py-2"}
          `}
        >
          <div
            className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-full
              bg-[#dedbd2]
              text-[11px]
              font-semibold
              text-[#57534e]
            "
          >
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                {user?.full_name ?? "Loading..."}
              </p>

              <p className="truncate text-[10px] text-[var(--muted)]">
                {user?.email ?? "Account"}
              </p>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Navigation Section */
/* -------------------------------------------------------------------------- */

interface NavigationSectionProps {
  title: string;
  items: NavigationItem[];
  collapsed: boolean;
  pathname: string;
}

function NavigationSection({
  title,
  items,
  collapsed,
  pathname,
}: NavigationSectionProps) {
  return (
    <div className="mb-7">

      {!collapsed && (
        <p
          className="
            mb-2 px-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.14em]
            text-[#a09d94]
          "
        >
          {title}
        </p>
      )}

      <div className="space-y-1">

        {items.map((item) => {

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              collapsed={collapsed}
              active={isActive}
            />
          );
        })}

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar Item */
/* -------------------------------------------------------------------------- */

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  active?: boolean;
  href?: string;
}

function SidebarItem({
  icon: Icon,
  label,
  collapsed,
  active = false,
  href,
}: SidebarItemProps) {

  const className = `
    group relative flex w-full items-center
    rounded-lg
    text-left
    transition-all duration-150

    ${
      collapsed
        ? "justify-center px-2 py-2.5"
        : "gap-3 px-3 py-2.5"
    }

    ${
      active
        ? `
          bg-white
          text-[var(--foreground)]
          shadow-[0_1px_3px_rgba(0,0,0,0.04)]
        `
        : `
          text-[#77746c]
          hover:bg-white/60
          hover:text-[var(--foreground)]
        `
    }
  `;

  const content = (
    <>
      {active && (
        <span
          className="
            absolute left-0
            h-4 w-[2px]
            rounded-full
            bg-[var(--primary)]
          "
        />
      )}

      <Icon
        className={`
          h-[17px] w-[17px] shrink-0
          transition-colors
          ${
            active
              ? "text-[var(--primary)]"
              : "text-[#929087] group-hover:text-[var(--foreground)]"
          }
        `}
      />

      {!collapsed && (
        <span className="truncate text-[12px] font-medium">
          {label}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      className={className}
    >
      {content}
    </button>
  );
}