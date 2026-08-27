"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CommentThread from "@/components/comments/CommentThread";
import { useParams } from "next/navigation";

export default function CommentsPage() {
  const params = useParams();
  const documentId = params.id as string;

  // Mock data – to be replaced with API calls
  const [comments, setComments] = useState([
    {
      id: "1",
      author: "Syeda Alishba",
      content: "Can you please update the intro section?",
      createdAt: "2h ago",
      status: "open",
      replies: [
        {
          id: "r1",
          author: "Zainab Bibi",
          content: "Sure, I'll update it today.",
          createdAt: "1h ago",
        },
      ],
    },
    {
      id: "2",
      author: "Fatima Khalid",
      content: "Looks good!",
      createdAt: "3h ago",
      status: "resolved",
      replies: [],
    },
  ]);

  const handleAddComment = (content: string) => {
    setComments((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        author: "You",
        content,
        createdAt: "Just now",
        status: "open",
        replies: [],
      },
    ]);
  };

  const handleReply = (commentId: string, content: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  author: "You",
                  content,
                  createdAt: "Just now",
                },
              ],
            }
          : c
      )
    );
  };

  const handleResolve = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, status: c.status === "open" ? "resolved" : "open" }
          : c
      )
    );
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-2xl font-semibold">Comments</h1>
        <div className="h-[600px] rounded-2xl border border-[var(--border)] bg-white">
          <CommentThread
            comments={comments}
            onAddComment={handleAddComment}
            onReply={handleReply}
            onResolve={handleResolve}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </MainLayout>
  );
}