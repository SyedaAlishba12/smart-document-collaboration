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

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("user_id") || "00000000-0000-0000-0000-000000000001"
      : "00000000-0000-0000-0000-000000000001";

  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const { users } = useWebSocket(documentId, userId);

  useEffect(() => {
    fetchComments();
    fetchUsers();
  }, [documentId]);

  async function fetchUsers() {
    try {
      const response = await apiFetch<any>(`/api/search/users?query=`);
      const users = response.data || [];
      const map: Record<string, string> = {};
      users.forEach((u: any) => {
        map[u.id] = u.full_name || u.name || u.email;
      });
      setUserMap(map);
    } catch (err) {
      // fallback mock
      setUserMap({
        "00000000-0000-0000-0000-000000000001": "You",
      });
    }
  }

  async function fetchComments() {
    try {
      const data = await apiFetch<any[]>(`/api/documents/${documentId}/comments`);
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          let replies: any[] = [];
          try {
            const replyData = await apiFetch<any[]>(`/api/comments/${comment.id}/replies`);
            replies = replyData.map((r: any) => ({
              id: r.id,
              author: userMap[r.user_id] || "User",
              content: r.content,
              createdAt: new Date(r.created_at).toLocaleString(),
            }));
          } catch (e) {
            // ignore
          }
          return {
            id: comment.id,
            author: userMap[comment.user_id] || "User",
            content: comment.content,
            createdAt: new Date(comment.created_at).toLocaleString(),
            status: comment.status,
            replies: replies,
          };
        })
      );
      setComments(commentsWithReplies);
    } catch (err: any) {
      setError(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(content: string) {
    try {
      const newComment = await apiFetch<any>(`/api/documents/${documentId}/comments`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) => [
        ...prev,
        {
          id: newComment.id,
          author: userMap[newComment.user_id] || "You",
          content: newComment.content,
          createdAt: new Date(newComment.created_at).toLocaleString(),
          status: newComment.status,
          replies: [],
        },
      ]);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReply(commentId: string, content: string) {
    try {
      const reply = await apiFetch<any>(`/api/comments/${commentId}/replies`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: reply.id,
                    author: "You",
                    content: reply.content,
                    createdAt: "Just now",
                  },
                ],
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleResolve(commentId: string) {
    try {
      const updated = await apiFetch<any>(`/api/comments/${commentId}/resolve`, {
        method: "POST",
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, status: updated.status } : c
        )
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