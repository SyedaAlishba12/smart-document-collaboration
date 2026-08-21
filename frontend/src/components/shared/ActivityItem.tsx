"use client";

import {
  FileEdit,
  FilePlus2,
  MessageCircle,
  Share2,
  Upload,
  UserPlus,
} from "lucide-react";

type ActivityType =
  | "created"
  | "updated"
  | "shared"
  | "comment"
  | "uploaded"
  | "workspace";

export interface ActivityItemProps {
  userName: string;
  userInitials?: string;
  activity: string;
  time: string;
  type?: ActivityType;
}

const activityIcons = {
  created: FilePlus2,
  updated: FileEdit,
  shared: Share2,
  comment: MessageCircle,
  uploaded: Upload,
  workspace: UserPlus,
};

export default function ActivityItem({
  userName,
  userInitials,
  activity,
  time,
  type = "updated",
}: ActivityItemProps) {
  const Icon = activityIcons[type];

  const initials =
    userInitials ||
    userName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-full bg-[#e8e5dd]
          text-[9px] font-semibold text-[#66635b]
        "
      >
        {initials}
      </div>

      {/* Activity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-xs leading-5 text-[var(--foreground)]">
            <span className="font-semibold">
              {userName}
            </span>{" "}
            {activity}
          </p>

          <div
            className="
              mt-0.5 flex h-6 w-6 shrink-0
              items-center justify-center
              rounded-lg bg-[#f4f2ed]
              text-[#89867d]
            "
          >
            <Icon className="h-3 w-3" />
          </div>
        </div>

        <p className="mt-0.5 text-[10px] text-[var(--muted)]">
          {time}
        </p>
      </div>
    </div>
  );
}