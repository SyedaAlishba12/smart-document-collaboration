"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface CursorPosition {
  x: number;
  y: number;
}

interface RemoteUpdate {
  content: string;
  title: string;
  user_id: string;
}

interface WebSocketMessage {
  event: string;
  data?: any;
}

export function useWebSocket(
  documentId: string,
  userId: string
) {
  const wsRef = useRef<WebSocket | null>(null);

  const [users, setUsers] = useState<string[]>([]);

  const [cursors, setCursors] = useState<
    Record<string, CursorPosition>
  >({});

  const [isConnected, setIsConnected] =
    useState(false);

  const [remoteUpdate, setRemoteUpdate] =
    useState<RemoteUpdate | null>(null);

  /*
   * Create the WebSocket connection.
   */
  useEffect(() => {
    if (!documentId || !userId) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      console.error(
        "No access token found for WebSocket connection."
      );
      return;
    }

    /*
     * Get backend API URL.
     */
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000";

    /*
     * Convert HTTP API URL to WebSocket URL.
     *
     * http://localhost:8000
     *       ↓
     * ws://localhost:8000
     *
     * https://example.com
     *       ↓
     * wss://example.com
     */
    let wsBase = apiBase;

    if (wsBase.startsWith("https://")) {
      wsBase = wsBase.replace(
        /^https:\/\//,
        "wss://"
      );
    } else if (
      wsBase.startsWith("http://")
    ) {
      wsBase = wsBase.replace(
        /^http:\/\//,
        "ws://"
      );
    }

    const wsUrl =
      `${wsBase}/ws/documents/${documentId}` +
      `?token=${encodeURIComponent(token)}`;

    /*
     * Do NOT log wsUrl because it contains
     * the authentication token.
     */
    console.log(
      "Connecting to collaboration WebSocket:",
      documentId
    );

    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    /*
     * WebSocket connected.
     */
    ws.onopen = () => {
      console.log(
        "Collaboration WebSocket connected:",
        documentId
      );

      setIsConnected(true);
    };

    /*
     * Receive messages from backend.
     */
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage =
          JSON.parse(event.data);

        console.log(
          "Collaboration WebSocket message:",
          message
        );

        /*
         * ========================================
         * DOCUMENT JOIN
         * ========================================
         *
         * Backend:
         *
         * {
         *   event: "document:join",
         *   data: {
         *     document_id,
         *     user_id,
         *     active_users
         *   }
         * }
         */
        if (
          message.event ===
          "document:join"
        ) {
          const activeUsers =
            Array.isArray(
              message.data?.active_users
            )
              ? message.data.active_users
              : [];

          setUsers(activeUsers);

          /*
           * Clear stale cursor positions whenever
           * the server sends a fresh active-user list.
           */
          setCursors((previousCursors) => {
            const nextCursors: Record<
              string,
              CursorPosition
            > = {};

            for (const activeUserId of activeUsers) {
              if (
                previousCursors[
                  activeUserId
                ]
              ) {
                nextCursors[
                  activeUserId
                ] =
                  previousCursors[
                    activeUserId
                  ];
              }
            }

            return nextCursors;
          });

          return;
        }

        /*
         * ========================================
         * DOCUMENT PRESENCE
         * ========================================
         *
         * Backend:
         *
         * {
         *   event: "document:presence",
         *   data: {
         *     user_id,
         *     status
         *   }
         * }
         */
        if (
          message.event ===
          "document:presence"
        ) {
          const otherUserId =
            message.data?.user_id;

          const status =
            message.data?.status;

          if (!otherUserId) {
            return;
          }

          setUsers(
            (previousUsers) => {
              const nextUsers =
                new Set(previousUsers);

              if (
                status === "online"
              ) {
                nextUsers.add(
                  otherUserId
                );
              }

              if (
                status === "offline"
              ) {
                nextUsers.delete(
                  otherUserId
                );
              }

              return Array.from(
                nextUsers
              );
            }
          );

          /*
           * Remove the user's cursor when
           * they leave the document.
           */
          if (
            status === "offline"
          ) {
            setCursors(
              (previousCursors) => {
                const nextCursors = {
                  ...previousCursors,
                };

                delete nextCursors[
                  otherUserId
                ];

                return nextCursors;
              }
            );
          }

          return;
        }

        /*
         * ========================================
         * DOCUMENT CURSOR
         * ========================================
         *
         * Receives another collaborator's
         * caret position.
         */
        if (
          message.event ===
          "document:cursor"
        ) {
          const otherUserId =
            message.data?.user_id;

          if (!otherUserId) {
            return;
          }

          /*
           * Ignore our own cursor just in case.
           * The backend normally sends cursor
           * updates to everyone except the sender.
           */
          if (
            otherUserId === userId
          ) {
            return;
          }

          setCursors(
            (previousCursors) => ({
              ...previousCursors,
              [otherUserId]: {
                x:
                  Number(
                    message.data?.x
                  ) || 0,

                y:
                  Number(
                    message.data?.y
                  ) || 0,
              },
            })
          );

          return;
        }

        /*
         * ========================================
         * DOCUMENT UPDATE
         * ========================================
         *
         * This is the important part for
         * realtime editor synchronization.
         *
         * Backend adds:
         *
         * data.user_id
         */
        if (
          message.event ===
          "document:update"
        ) {
          const updateUserId =
            message.data?.user_id;

          if (!updateUserId) {
            return;
          }

          /*
           * Ignore our own update.
           *
           * The backend normally excludes
           * the sender already, but this is
           * an additional safety check.
           */
          if (
            updateUserId === userId
          ) {
            return;
          }

          const content =
            message.data?.content;

          const title =
            message.data?.title;

          /*
           * Only accept actual document
           * content updates.
           */
          if (
            typeof content !==
            "string"
          ) {
            return;
          }

          setRemoteUpdate({
            content,
            title:
              typeof title ===
              "string"
                ? title
                : "",
            user_id:
              updateUserId,
          });

          return;
        }

        /*
         * ========================================
         * DOCUMENT SAVE
         * ========================================
         *
         * Currently we don't need to update
         * the editor for this event.
         *
         * Keeping the handler here makes the
         * hook ready for future save-status
         * functionality.
         */
        if (
          message.event ===
          "document:save"
        ) {
          console.log(
            "Remote document save received."
          );

          return;
        }
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    /*
     * WebSocket error.
     */
    ws.onerror = (error) => {
      console.error(
        "Collaboration WebSocket error:",
        error
      );

      setIsConnected(false);
    };

    /*
     * WebSocket closed.
     */
    ws.onclose = (event) => {
      console.log(
        "Collaboration WebSocket disconnected:",
        documentId,
        "code:",
        event.code
      );

      setIsConnected(false);

      if (
        wsRef.current === ws
      ) {
        wsRef.current = null;
      }
    };

    /*
     * Cleanup.
     *
     * React can run effects twice in development.
     *
     * We therefore check both OPEN and
     * CONNECTING before closing.
     */
    return () => {
      /*
       * Remove handlers first so a development
       * cleanup does not cause unnecessary state
       * updates.
       */
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      /*
       * Close both an OPEN and CONNECTING socket.
       */
      if (
        ws.readyState ===
          WebSocket.OPEN ||
        ws.readyState ===
          WebSocket.CONNECTING
      ) {
        ws.close();
      }

      if (
        wsRef.current === ws
      ) {
        wsRef.current = null;
      }

      setIsConnected(false);
    };
  }, [
    documentId,
    userId,
  ]);

  /*
   * ========================================
   * GENERIC MESSAGE SENDER
   * ========================================
   */
  const sendMessage = useCallback(
    (
      event: string,
      data: any = {}
    ) => {
      const ws =
        wsRef.current;

      if (
        !ws ||
        ws.readyState !==
          WebSocket.OPEN
      ) {
        return false;
      }

      try {
        ws.send(
          JSON.stringify({
            event,
            data,
          })
        );

        return true;
      } catch (error) {
        console.error(
          "Failed to send WebSocket message:",
          error
        );

        return false;
      }
    },
    []
  );

  /*
   * ========================================
   * SEND DOCUMENT UPDATE
   * ========================================
   */
  const sendDocumentUpdate =
    useCallback(
      (
        content: string,
        title: string
      ) => {
        return sendMessage(
          "document:update",
          {
            content,
            title,
          }
        );
      },
      [sendMessage]
    );

  /*
   * ========================================
   * SEND CURSOR POSITION
   * ========================================
   */
  const sendCursor =
    useCallback(
      (
        x: number,
        y: number
      ) => {
        return sendMessage(
          "document:cursor",
          {
            x,
            y,
          }
        );
      },
      [sendMessage]
    );

  /*
   * Return everything required by
   * the editor page.
   */
  return {
    users,
    cursors,
    isConnected,
    remoteUpdate,
    sendMessage,
    sendDocumentUpdate,
    sendCursor,
  };
}