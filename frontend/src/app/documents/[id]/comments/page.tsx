"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CommentThread from "@/components/comments/CommentThread";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api_client";
import { ArrowLeft } from "lucide-react";

export default function CommentsPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCommentsPage() {
      try {
        const namesMap = await fetchUsers();
        await fetchComments(namesMap);
      } catch (err: any) {
        setError(err.message || "Failed to load comments");
        setLoading(false);
      }
    }

    loadCommentsPage();
  }, [documentId]);

  async function fetchUsers(): Promise<Record<string, string>> {
    try {
      const response = await api.get("/api/search/users?query=a");

      const users = response.data?.items || [];

      const map: Record<string, string> = {};

      users.forEach((u: any) => {
        if (u.id) {
          map[u.id] =
            u.title ||
            u.full_name ||
            u.name ||
            u.email ||
            "User";
        }
      });

      setUserMap(map);

      return map;
    } catch (err) {
      console.error("Failed to load users:", err);

      const fallbackMap: Record<string, string> = {
        "00000000-0000-0000-0000-000000000001": "You",
      };

      setUserMap(fallbackMap);

      return fallbackMap;
    }
  }

  async function fetchComments(
    namesMap: Record<string, string> = userMap
  ) {
    try {
      const response = await api.get(
        `/api/documents/${documentId}/comments`
      );

      const data = response.data;

      const commentsWithReplies = await Promise.all(
        data.map(async (comment: any) => {
          let replies: any[] = [];

          try {
            const replyResponse = await api.get(
              `/api/comments/${comment.id}/replies`
            );

            const replyData = replyResponse.data;

            replies = replyData.map((r: any) => ({
              id: r.id,

              // Prefer author_name returned directly by backend
              author:
                r.author_name ||
                namesMap[r.user_id] ||
                "User",

              content: r.content,

              createdAt: new Date(
                r.created_at
              ).toLocaleString(),
            }));
          } catch (e) {
            console.error(
              "Failed to load replies for comment:",
              comment.id
            );
          }

          return {
            id: comment.id,

            // Prefer author_name returned directly by backend
            author:
              comment.author_name ||
              namesMap[comment.user_id] ||
              "User",

            content: comment.content,

            createdAt: new Date(
              comment.created_at
            ).toLocaleString(),

            status: comment.status,

            replies,
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
      const response = await api.post(
        `/api/documents/${documentId}/comments`,
        { content }
      );

      const newComment = response.data;

      setComments((prev) => [
        ...prev,
        {
          id: newComment.id,

          // Prefer author_name returned by backend
          author:
            newComment.author_name ||
            userMap[newComment.user_id] ||
            "You",

          content: newComment.content,

          createdAt: new Date(
            newComment.created_at
          ).toLocaleString(),

          status: newComment.status,

          replies: [],
        },
      ]);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReply(
    commentId: string,
    content: string
  ) {
    try {
      const response = await api.post(
        `/api/comments/${commentId}/replies`,
        { content }
      );

      const reply = response.data;

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: reply.id,

                    // Prefer author_name returned by backend
                    author:
                      reply.author_name ||
                      userMap[reply.user_id] ||
                      "You",

                    content: reply.content,

                    createdAt: new Date(
                      reply.created_at
                    ).toLocaleString(),
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
      const response = await api.post(
        `/api/comments/${commentId}/resolve`
      );

      const updated = response.data;

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: updated.status,
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await api.delete(
        `/api/comments/${commentId}`
      );

      setComments((prev) =>
        prev.filter(
          (c) => c.id !== commentId
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return <p>Loading comments...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Back to document"
            title="Back to document"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-2xl font-semibold">
            Comments
          </h1>
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