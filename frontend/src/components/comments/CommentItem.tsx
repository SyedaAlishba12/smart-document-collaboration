"use client";

import { useState } from "react";
import { MessageCircle, MoreHorizontal, Check } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import ReplyInput from "./ReplyInput";
import Dropdown from "@/components/ui/Dropdown";

interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentItemProps {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  status: "open" | "resolved";
  replies: Reply[];
  onReply: (content: string) => void;
  onResolve: () => void;
  onDelete: () => void;
}

export default function CommentItem({
  id,
  author,
  authorAvatar,
  content,
  createdAt,
  status,
  replies,
  onReply,
  onResolve,
  onDelete,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={authorAvatar} name={author} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {author}
            </span>
            <span className="text-[10px] text-[var(--muted)]">{createdAt}</span>
            {status === "resolved" && (
              <Badge variant="success">
                <Check className="h-3 w-3" /> Resolved
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-[var(--foreground-secondary)]">
            {content}
          </p>
        </div>

        <Dropdown
          trigger={
            <button className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-muted)]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            {
              label: status === "open" ? "Mark as resolved" : "Reopen",
              onClick: onResolve,
            },
            {
              label: "Delete",
              onClick: onDelete,
              danger: true,
            },
          ]}
        />
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-[var(--border)] pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar name={reply.author} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  {reply.author}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {reply.content}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {reply.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="mt-3">
          <ReplyInput
            onSubmit={(text) => {
              onReply(text);
              setShowReply(false);
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3">
        <button
          className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={() => setShowReply((v) => !v)}
        >
          Reply
        </button>
        <button className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
          Share
        </button>
      </div>
    </div>
  );
}