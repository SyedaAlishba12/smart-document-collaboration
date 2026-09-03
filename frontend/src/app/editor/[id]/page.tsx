"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import api from "@/lib/api_client";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import ShareDialog from "@/components/sharing/ShareDialog";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();

  const docId = params.id;

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Saved");

  const [isInitialized, setIsInitialized] =
    useState(false);

  const [
    isShareModalOpen,
    setIsShareModalOpen,
  ] = useState(false);

  const [
    attachedFiles,
    setAttachedFiles,
  ] = useState<
    {
      id: string;
      name: string;
      url: string;
    }[]
  >([]);

  const { user } = useAuth();

  /*
   * ========================================
   * CLEAN DOCUMENT ID
   * ========================================
   */

  const rawDocumentId = Array.isArray(docId)
    ? docId[0]
    : docId;

  const cleanDocumentId = rawDocumentId
    ? rawDocumentId.replace(/\.[^/.]+$/, "")
    : "";

  /*
   * ========================================
   * TITLE REF
   * ========================================
   */

  const titleRef = useRef("");

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  /*
   * ========================================
   * REALTIME COLLABORATION
   * ========================================
   */

  const {
    users,
    cursors,
    isConnected,
    remoteUpdate,
    sendDocumentUpdate,
    sendCursor,
  } = useWebSocket(
    cleanDocumentId,
    user?.id || ""
  );

  /*
   * ========================================
   * EDITOR CONTAINER REF
   * ========================================
   */

  const editorContainerRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ========================================
   * INITIALIZATION REF
   * ========================================
   */

  const isInitializedRef =
    useRef(false);

  /*
   * ========================================
   * REMOTE UPDATE REF
   * ========================================
   */

  const applyingRemoteUpdateRef =
    useRef(false);

  /*
   * ========================================
   * SAVE DOCUMENT TO SERVER
   * ========================================
   */

  const saveToServer = useCallback(
    async (
      currentContent: string,
      currentTitle: string
    ) => {
      try {
        const workspaceId =
          localStorage.getItem(
            "workspace_id"
          ) || "";

        await api.post(
          `/api/documents/${cleanDocumentId}/autosave`,
          {
            title:
              currentTitle ||
              "Untitled Document",

            content: currentContent,

            workspace_id:
              workspaceId,
          }
        );

        setStatus("Saved");
      } catch (error) {
        console.error(
          "Save failed:",
          error
        );

        setStatus("Error saving");
      }
    },
    [cleanDocumentId]
  );

  /*
   * ========================================
   * DEBOUNCED SAVE
   * ========================================
   */

  const debouncedSave = useCallback(
    (() => {
      let timer:
        | ReturnType<typeof setTimeout>
        | undefined;

      return (
        content: string,
        titleText: string
      ) => {
        if (timer) {
          clearTimeout(timer);
        }

        setStatus("Saving...");

        timer = setTimeout(() => {
          saveToServer(
            content,
            titleText
          );
        }, 1000);
      };
    })(),
    [saveToServer]
  );

  /*
   * ========================================
   * TIPTAP EDITOR
   * ========================================
   */

  const editor = useEditor({
  extensions: [
  StarterKit.configure({
    link: {
      openOnClick: true,
      HTMLAttributes: {
        class: "text-blue-600 underline cursor-pointer",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    },
  }),
  Image.configure({
        HTMLAttributes: {
          class:
            "max-w-full h-auto rounded-xl my-4 border border-gray-200 shadow-sm object-contain",
        },
      }),

      Table.configure({
        resizable: true,

        HTMLAttributes: {
          class:
            "border-collapse table-auto w-full border border-gray-300 my-4",
        },
      }),

      TableRow.configure({
        HTMLAttributes: {
          class:
            "border-b border-gray-300",
        },
      }),

      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-gray-300 bg-gray-100 p-2 font-semibold text-left",
        },
      }),

      TableCell.configure({
        HTMLAttributes: {
          class:
            "border border-gray-300 p-2",
        },
      }),
    ],

    content: "",

    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "max-w-none focus:outline-none min-h-[550px] text-gray-800 text-base leading-relaxed font-sans p-2",
      },
    },

    /*
     * ========================================
     * LOCAL EDITOR UPDATE
     * ========================================
     */

    onUpdate: ({ editor }) => {
      if (!isInitializedRef.current) {
        return;
      }

      if (
        applyingRemoteUpdateRef.current
      ) {
        return;
      }

      /*
       * Safety check in case TipTap has
       * already destroyed the editor.
       */
      if (editor.isDestroyed) {
        return;
      }

      const htmlContent =
        editor.getHTML();

      const currentTitle =
        titleRef.current;

      setStatus(
        "Unsaved changes..."
      );

      sendDocumentUpdate(
        htmlContent,
        currentTitle
      );

      debouncedSave(
        htmlContent,
        currentTitle
      );
    },
  });

  /*
   * ========================================
   * SEND CURRENT CURSOR
   * ========================================
   */

  const sendCurrentCursor =
    useCallback(() => {
      if (
        !editor ||
        editor.isDestroyed ||
        !isInitializedRef.current ||
        !isConnected ||
        !editorContainerRef.current
      ) {
        return;
      }

      try {
        const { from } =
          editor.state.selection;

        const coords =
          editor.view.coordsAtPos(from);

        const container =
          editorContainerRef.current;

        const containerRect =
          container.getBoundingClientRect();

        const x =
          coords.left -
          containerRect.left;

        const y =
          coords.top -
          containerRect.top;

        sendCursor(x, y);
      } catch (error) {
        console.error(
          "Failed to send cursor position:",
          error
        );
      }
    }, [
      editor,
      isConnected,
      sendCursor,
    ]);

  /*
   * ========================================
   * CURSOR SELECTION CHANGES
   * ========================================
   */

  useEffect(() => {
    if (
      !editor ||
      editor.isDestroyed
    ) {
      return;
    }

    const handleSelectionUpdate =
      () => {
        if (
          editor.isDestroyed
        ) {
          return;
        }

        sendCurrentCursor();
      };

    editor.on(
      "selectionUpdate",
      handleSelectionUpdate
    );

    return () => {
      if (
        !editor.isDestroyed
      ) {
        editor.off(
          "selectionUpdate",
          handleSelectionUpdate
        );
      }
    };
  }, [
    editor,
    sendCurrentCursor,
  ]);

  /*
   * ========================================
   * INITIAL CURSOR POSITION
   * ========================================
   */

  useEffect(() => {
    if (
      !isConnected ||
      !editor ||
      editor.isDestroyed ||
      !isInitializedRef.current
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        if (
          editor &&
          !editor.isDestroyed
        ) {
          sendCurrentCursor();
        }
      }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isConnected,
    editor,
    sendCurrentCursor,
  ]);

  /*
   * ========================================
   * CURSOR ON SCROLL / RESIZE
   * ========================================
   */

  useEffect(() => {
    const container =
      editorContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      sendCurrentCursor();
    };

    const scrollParent =
      container.closest("main");

    scrollParent?.addEventListener(
      "scroll",
      handleScroll
    );

    window.addEventListener(
      "resize",
      handleScroll
    );

    return () => {
      scrollParent?.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        handleScroll
      );
    };
  }, [
    sendCurrentCursor,
    editor,
  ]);

  /*
   * ========================================
   * FETCH DOCUMENT CONTENT
   * ========================================
   *
   * IMPORTANT:
   * This effect contains the fix for:
   *
   * Cannot read properties of null
   * (reading 'commands')
   *
   * The API request is asynchronous, so the
   * editor can be destroyed/recreated while
   * the request is still running.
   *
   * We therefore check:
   *
   * 1. editor exists
   * 2. editor is not destroyed
   * 3. component is still active
   *
   * before calling editor.commands.
   */

  useEffect(() => {
    if (
      !docId ||
      !editor ||
      editor.isDestroyed ||
      !cleanDocumentId
    ) {
      return;
    }

    let isActive = true;

    /*
     * ========================================
     * CHECK VIEWER PERMISSION
     * ========================================
     */

    if (user) {
      import("@/lib/permissions_api")
        .then(
          ({
            getPermissions,
          }) => {
            if (!isActive) {
              return null;
            }

            return getPermissions(
              cleanDocumentId
            );
          }
        )
        .then((res) => {
          if (
            !isActive ||
            !res ||
            !editor ||
            editor.isDestroyed
          ) {
            return;
          }

          if (
            res.success &&
            res.data
          ) {
            const myPerm =
              res.data.items.find(
                (p) =>
                  p.user_id ===
                  user.id
              );

            if (
              myPerm &&
              myPerm.permission_level ===
                "viewer"
            ) {
              if (
                !editor.isDestroyed
              ) {
                editor.setEditable(
                  false
                );
              }
            }
          }
        })
        .catch((err) => {
          if (isActive) {
            console.error(
              "Error loading permissions:",
              err
            );
          }
        });
    }

    /*
     * ========================================
     * LOAD ACTUAL DOCUMENT
     * ========================================
     */

    api
      .get(
        `/api/documents/${cleanDocumentId}`
      )
      .then((res) => {
        /*
         * IMPORTANT:
         * The component/editor may have been
         * unmounted while the request was
         * running.
         */

        if (
          !isActive ||
          !editor ||
          editor.isDestroyed
        ) {
          return;
        }

        const docData =
          res.data.data;

        const loadedTitle =
          docData.title ||
          "Untitled Document";

        setTitle(
          loadedTitle
        );

        titleRef.current =
          loadedTitle;

        /*
         * Prevent this initial content
         * assignment from being treated
         * as a realtime/local update.
         */

        applyingRemoteUpdateRef.current =
          true;

        /*
         * FINAL SAFETY CHECK before
         * accessing editor.commands.
         */

        if (
          !editor.isDestroyed
        ) {
          editor.commands.setContent(
            docData.content || "",
            {
              emitUpdate: false,
            }
          );
        }

        applyingRemoteUpdateRef.current =
          false;

        if (!isActive) {
          return;
        }

        setIsInitialized(true);

        isInitializedRef.current =
          true;
      })
      .catch((err) => {
        if (isActive) {
          console.error(
            "Error loading document:",
            err
          );

          applyingRemoteUpdateRef.current =
            false;
        }
      });

    /*
     * Cleanup:
     * Prevent an old async request from
     * touching a new/destroyed editor.
     */

    return () => {
      isActive = false;

      applyingRemoteUpdateRef.current =
        false;
    };
  }, [
    docId,
    editor,
    user,
    cleanDocumentId,
  ]);

  /*
   * ========================================
   * APPLY REMOTE DOCUMENT UPDATE
   * ========================================
   */

  useEffect(() => {
    if (
      !editor ||
      editor.isDestroyed ||
      !remoteUpdate
    ) {
      return;
    }

    if (
      remoteUpdate.user_id ===
      user?.id
    ) {
      return;
    }

    if (
      typeof remoteUpdate.content !==
      "string"
    ) {
      return;
    }

    /*
     * Safety check before using commands.
     */

    if (editor.isDestroyed) {
      return;
    }

    applyingRemoteUpdateRef.current =
      true;

    try {
      if (
        !editor.isDestroyed
      ) {
        editor.commands.setContent(
          remoteUpdate.content,
          {
            emitUpdate: false,
          }
        );
      }

      if (
        remoteUpdate.title
      ) {
        setTitle(
          remoteUpdate.title
        );

        titleRef.current =
          remoteUpdate.title;
      }

      setStatus(
        "Updated by collaborator"
      );
    } catch (error) {
      console.error(
        "Failed to apply remote update:",
        error
      );
    } finally {
      applyingRemoteUpdateRef.current =
        false;
    }
  }, [
    editor,
    remoteUpdate,
    user?.id,
  ]);

  /*
   * ========================================
   * CTRL + S / CMD + S
   * ========================================
   */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (
          !editor ||
          editor.isDestroyed ||
          !isInitialized
        ) {
          return;
        }

        setStatus("Saving...");

        saveToServer(
          editor.getHTML(),
          titleRef.current
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    editor,
    isInitialized,
    saveToServer,
  ]);

  /*
   * ========================================
   * TITLE CHANGES
   * ========================================
   */

  const handleTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTitle =
      e.target.value;

    setTitle(newTitle);

    titleRef.current =
      newTitle;

    if (
      isInitialized &&
      editor &&
      !editor.isDestroyed
    ) {
      sendDocumentUpdate(
        editor.getHTML(),
        newTitle
      );

      debouncedSave(
        editor.getHTML(),
        newTitle
      );
    }
  };

  /*
   * ========================================
   * SAVE AND EXIT
   * ========================================
   */

  const handleSaveAndExit =
    async () => {
      if (
        !editor ||
        editor.isDestroyed
      ) {
        return;
      }

      setStatus("Saving...");

      try {
        const workspaceId =
          localStorage.getItem(
            "workspace_id"
          ) || "";

        await api.post(
          `/api/documents/${cleanDocumentId}/autosave`,
          {
            title:
              titleRef.current ||
              "Untitled Document",

            content:
              editor.getHTML(),

            workspace_id:
              workspaceId,
          }
        );

        setStatus("Saved");

        router.push(
          "/documents"
        );
      } catch (error) {
        console.error(
          "Save & exit failed:",
          error
        );

        setStatus(
          "Error saving"
        );
      }
    };

  /*
   * ========================================
   * VERSION HISTORY
   * ========================================
   */

  const handleVersionHistory =
    () => {
      router.push(
        `/documents/${cleanDocumentId}/versions`
      );
    };

  /*
   * ========================================
   * IMAGE UPLOAD
   * ========================================
   */

  const handleImageUpload =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      try {
        setStatus(
          "Uploading image..."
        );

        const res =
          await api.post(
            "/api/files/upload",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const responseData =
          res.data.data ||
          res.data;

        const fileId =
          responseData.id;

        let imageUrl =
          responseData.file_url;

        if (fileId) {
          try {
            const downloadRes =
              await api.get(
                `/api/files/${fileId}/download`
              );

            if (
              downloadRes.data
                ?.data?.file_url
            ) {
              imageUrl =
                downloadRes.data
                  .data.file_url;
            }
          } catch (err) {
            console.error(
              "Could not fetch download URL, falling back to file_url",
              err
            );
          }
        }

        if (
          imageUrl &&
          !imageUrl.startsWith(
            "http"
          )
        ) {
          const apiBase =
            process.env
              .NEXT_PUBLIC_API_BASE_URL ||
            "http://localhost:8000";

          imageUrl =
            `${apiBase}${
              imageUrl.startsWith("/")
                ? ""
                : "/"
            }${imageUrl}`;
        }

        if (
          editor &&
          !editor.isDestroyed &&
          imageUrl
        ) {
          editor
            .chain()
            .focus()
            .setImage({
              src: imageUrl,
            })
            .run();
        }

        if (
          isInitialized &&
          editor &&
          !editor.isDestroyed
        ) {
          const updatedContent =
            editor.getHTML();

          setStatus(
            "Saving..."
          );

          await saveToServer(
            updatedContent,
            titleRef.current
          );
        }

        setStatus("Saved");
      } catch (err) {
        console.error(
          "Image upload failed:",
          err
        );

        setStatus(
          "Error uploading image"
        );
      }
    };

  /*
   * ========================================
   * INSERT / EDIT HYPERLINK
   * ========================================
   */

  const setLink = () => {
    if (
      !editor ||
      editor.isDestroyed
    ) {
      return;
    }

    const previousUrl =
      editor.getAttributes(
        "link"
      ).href;

    const url =
      window.prompt(
        "Enter URL:",
        previousUrl
      );

    if (url === null) {
      return;
    }

    if (url === "") {
      editor
        .chain()
        .focus()
        .extendMarkRange(
          "link"
        )
        .unsetLink()
        .run();

      return;
    }

    const {
      from,
      to,
    } =
      editor.state.selection;

    if (from === to) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        )
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange(
          "link"
        )
        .setLink({
          href: url,
        })
        .run();
    }
  };

  /*
   * ========================================
   * FILE ATTACHMENT UPLOAD
   * ========================================
   */

  const handleFileUpload =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      try {
        setStatus(
          "Uploading file..."
        );

        const res =
          await api.post(
            "/api/files/upload",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const responseData =
          res.data.data ||
          res.data;

        const fileId =
          responseData.id;

        const fileName =
          responseData.file_name ||
          file.name;

        const apiBase =
          process.env
            .NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:8000";

        const fileUrl =
          `${apiBase}/api/files/${fileId}/download`;

        const fileEntry = {
          id: fileId,
          name: fileName,
          url: fileUrl,
        };

        setAttachedFiles(
          (previousFiles) => [
            ...previousFiles,
            fileEntry,
          ]
        );

        if (
          editor &&
          !editor.isDestroyed
        ) {
          editor
            .chain()
            .focus()
            .insertContent(
              `<p>📎 <a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${fileName}</a></p>`
            )
            .run();
        }

        setStatus("Saved");
      } catch (err) {
        console.error(
          "File attachment failed:",
          err
        );

        setStatus(
          "Error uploading image"
        );
      }
    };

  /*
   * ========================================
   * TIPTAP MAY NOT BE READY
   * ========================================
   */

  if (!editor) {
    return null;
  }

  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <div className="h-screen bg-[#FBFBFA] flex flex-col overflow-hidden text-[#1A1A1A]">

      {/* Header */}

      <header className="border-b border-gray-200 bg-white px-8 py-3 flex justify-between items-center shadow-sm shrink-0">

        <input
          type="text"
          value={title}
          onChange={
            handleTitleChange
          }
          className="text-lg font-semibold bg-transparent focus:outline-none w-1/3 text-gray-900"
          placeholder="Document Title..."
        />

        <div className="flex items-center gap-3">

          {/* Realtime status */}

          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              isConnected
                ? "text-green-700 bg-green-50"
                : "text-gray-500 bg-gray-100"
            }`}
          >
            {isConnected
              ? `Realtime • ${users.length} online`
              : "Realtime • Offline"}
          </span>

          {/* Save status */}

          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {status}
          </span>

          {/* Share */}

          <button
            type="button"
            onClick={() =>
              setIsShareModalOpen(
                true
              )
            }
            className="bg-[#2f6f68] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#255b55] transition shadow-sm cursor-pointer z-50 relative"
          >
            Share
          </button>

          {/* Comments */}

          <button
            type="button"
            onClick={() => {
              router.push(
                `/documents/${cleanDocumentId}/comments`
              );
            }}
            className="border border-gray-300 bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Comments
          </button>

          {/* Version History */}

          <button
            type="button"
            onClick={
              handleVersionHistory
            }
            className="border border-gray-300 bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Version History
          </button>

          {/* Save & Exit */}

          <button
            type="button"
            onClick={
              handleSaveAndExit
            }
            className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm cursor-pointer"
          >
            Save & Exit
          </button>

        </div>
      </header>

      {/* Formatting Toolbar */}

      <div className="bg-white border-b border-gray-200 px-8 py-2.5 flex flex-wrap gap-1.5 text-xs font-medium text-gray-700 shadow-sm items-center shrink-0">

        {/* H1 */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 1,
              })
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive(
              "heading",
              {
                level: 1,
              }
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          H1
        </button>

        {/* H2 */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive(
              "heading",
              {
                level: 2,
              }
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          H2
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Bold */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition font-bold cursor-pointer ${
            editor.isActive("bold")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          B
        </button>

        {/* Italic */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition italic cursor-pointer ${
            editor.isActive(
              "italic"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          I
        </button>

        {/* Underline */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition underline cursor-pointer ${
            editor.isActive(
              "underline"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          U
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Bullet List */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive(
              "bulletList"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Bullet List
        </button>

        {/* Ordered List */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive(
              "orderedList"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Numbered List
        </button>

        {/* Quote */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive(
              "blockquote"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Quote
        </button>

        {/* Code Block */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleCodeBlock()
              .run()
          }
          className={`px-2.5 py-1 border rounded transition font-mono cursor-pointer ${
            editor.isActive(
              "codeBlock"
            )
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Code Block
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Link */}

        <button
          type="button"
          onClick={setLink}
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive("link")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Link
        </button>

        {/* Table */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({
                rows: 3,
                cols: 3,
                withHeaderRow: true,
              })
              .run()
          }
          className="px-2.5 py-1 border rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
        >
          Insert Table
        </button>

        {/* Image */}

        <label className="px-2.5 py-1 border rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer">

          Image

          <input
            type="file"
            accept="image/*"
            onChange={
              handleImageUpload
            }
            className="hidden"
          />

        </label>

        {/* Attach File */}

        <label className="px-2.5 py-1 border rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer">

          Attach File

          <input
            type="file"
            onChange={
              handleFileUpload
            }
            className="hidden"
          />

        </label>

      </div>

      {/* Editor */}

      <main className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">

        <div
          ref={editorContainerRef}
          className="relative max-w-4xl w-full bg-white p-8 border border-gray-200 rounded-xl shadow-sm h-fit mb-12"
        >

          <EditorContent
            editor={editor}
          />

          {/* ========================================
              REMOTE COLLABORATOR CURSORS
              ======================================== */}

          {Object.entries(cursors).map(
            ([
              remoteUserId,
              position,
            ]) => {

              /*
               * Never render our own cursor.
               */

              if (
                remoteUserId ===
                user?.id
              ) {
                return null;
              }

              /*
               * Only show cursor while
               * collaborator is online.
               */

              if (
                !users.includes(
                  remoteUserId
                )
              ) {
                return null;
              }

              return (
                <div
                  key={remoteUserId}
                  className="absolute z-40 pointer-events-none transition-all duration-75"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                  }}
                >

                  <div className="relative">

                    {/* Cursor line */}

                    <div className="w-0.5 h-5 bg-blue-500 rounded-full shadow-sm" />

                    {/* Collaborator label */}

                    <div className="absolute left-1 top-[-18px] whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white bg-blue-500 shadow-sm">
                      Collaborator
                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </main>

      {/* Share Dialog */}

      {isShareModalOpen && (
        <ShareDialog
          documentId={
            cleanDocumentId
          }
          documentName={
            title ||
            "Untitled Document"
          }
          open={
            isShareModalOpen
          }
          onClose={() =>
            setIsShareModalOpen(
              false
            )
          }
        />
      )}

    </div>
  );
}