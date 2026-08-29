"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CommentThread from "@/components/comments/CommentThread";
import PresenceIndicator from "@/components/collaboration/PresenceIndicator";
import { useParams } from "next/navigation";
import apiFetch from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function CommentsPage() {
  const params = useParams();
  const documentId = params.id as string;

  // Get current user ID from localStorage (temporary, replace with auth context)
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") || "00000000-0000-0000-0000-000000000001" : "00000000-0000-0000-0000-000000000001";

  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // WebSocket integration for presence
  const { users } = useWebSocket(documentId, userId);

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  async function fetchComments() {
    try {
      const data = await apiFetch<any[]>(`/api/documents/${documentId}/comments`);
      setComments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(content: string) {
    try {
      const newComment = await apiFetch(`/api/documents/${documentId}/comments`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) => [...prev, newComment]);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReply(commentId: string, content: string) {
    try {
      const reply = await apiFetch(`/api/comments/${commentId}/replies`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleResolve(commentId: string) {
    try {
      const updated = await apiFetch(`/api/comments/${commentId}/resolve`, {
        method: "POST",
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <p>Loading comments...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Comments</h1>
          <PresenceIndicator activeCount={users.length} />
        </div>
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