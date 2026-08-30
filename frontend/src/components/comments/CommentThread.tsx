"use client";

import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";
import { MessageCircle } from "lucide-react";

interface CommentThreadProps {
  comments: any[]; // You can import the type from CommentItem if needed
  onAddComment: (content: string) => void;
  onReply: (commentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

export default function CommentThread({
  comments,
  onAddComment,
  onReply,
  onResolve,
  onDelete,
}: CommentThreadProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-8 w-8 text-[var(--muted-light)]" />
            <p className="mt-2 text-sm text-[var(--muted)]">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            {...comment}
            onReply={(text) => onReply(comment.id, text)}
            onResolve={() => onResolve(comment.id)}
            onDelete={() => onDelete(comment.id)}
          />
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <CommentInput onSubmit={onAddComment} />
      </div>
    </div>
  );
}