"use client";

import { useEffect, useState } from "react";

interface WebSocketMessage {
  event: string;
  user_id?: string;
  data?: any;
}

export function useWebSocket(documentId: string, userId: string) {
  const [users, setUsers] = useState<string[]>([]);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const ws = new WebSocket(
      `ws://localhost:8000/ws/documents/${documentId}?token=${token}`
    );

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.event === "document:join") {
        setUsers(message.data.active_users || []);
      } else if (message.event === "document:presence") {
        setUsers((prev) => {
          const next = new Set(prev);
          if (message.data.status === "online") next.add(message.user_id!);
          else next.delete(message.user_id!);
          return Array.from(next);
        });
      } else if (message.event === "document:cursor" && message.user_id) {
        setCursors((prev) => ({
          ...prev,
          [message.user_id!]: message.data,
        }));
      }
    };

    return () => ws.close();
  }, [documentId, userId]);

  return { users, cursors };
}