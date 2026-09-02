"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import ShareDialog from "@/components/sharing/ShareDialog";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id;

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Saved");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [attachedFiles, setAttachedFiles] = useState<
    { id: string; name: string; url: string }[]
  >([]);

  const editor = useEditor({
    extensions: [
      StarterKit,

      Underline,

      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
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
          class: "border-b border-gray-300",
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
          class: "border border-gray-300 p-2",
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

    onUpdate: ({ editor }) => {
      if (!isInitialized) return;

      const htmlContent = editor.getHTML();

      setStatus("Unsaved changes...");
      debouncedSave(htmlContent, title);
    },
  });

  // Fetch document content on load and clean any accidental file extension from docId
  useEffect(() => {
    if (docId && editor) {
      const rawId = Array.isArray(docId) ? docId[0] : docId;
      const cleanDocId = rawId.replace(/\.[^/.]+$/, "");

      axios
        .get(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "http://localhost:8000"
          }/api/documents/${cleanDocId}`
        )
        .then((res) => {
          const docData = res.data.data;

          setTitle(docData.title || "Untitled Document");

          // Make sure the Tiptap editor instance exists before using commands
          if (editor) {
            editor.commands.setContent(docData.content || "");
          }

          setIsInitialized(true);
        })
        .catch((err) => {
          console.error("Error loading document:", err);
        });
    }
  }, [docId, editor]);

  // Save document content to server
  const saveToServer = useCallback(
    async (currentContent: string, currentTitle: string) => {
      try {
        const rawId = Array.isArray(docId) ? docId[0] : docId;

        const cleanDocId = rawId
          ? rawId.replace(/\.[^/.]+$/, "")
          : "";

        const workspaceId =
          localStorage.getItem("workspace_id") || "";

        await axios.post(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "http://localhost:8000"
          }/api/documents/${cleanDocId}/autosave`,
          {
            title: currentTitle || "Untitled Document",
            content: currentContent,
            workspace_id: workspaceId,
          }
        );

        setStatus("Saved");
      } catch (error) {
        console.error("Save failed:", error);
        setStatus("Error saving");
      }
    },
    [docId]
  );

  // Handle Ctrl + S / Cmd + S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (!editor || !isInitialized) return;

        setStatus("Saving...");
        saveToServer(editor.getHTML(), title);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, isInitialized, title, saveToServer]);

  // Debounced save to prevent excessive API calls
  const debouncedSave = useCallback(
    (() => {
      let timer: NodeJS.Timeout;

      return (content: string, titleText: string) => {
        clearTimeout(timer);

        setStatus("Saving...");

        timer = setTimeout(() => {
          saveToServer(content, titleText);
        }, 1000);
      };
    })(),
    [saveToServer]
  );

  // Handle title changes
  const handleTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTitle = e.target.value;

    setTitle(newTitle);

    if (isInitialized && editor) {
      debouncedSave(editor.getHTML(), newTitle);
    }
  };

  // Save and exit to documents page
  const handleSaveAndExit = async () => {
    if (!editor) return;

    setStatus("Saving...");

    try {
      const rawId = Array.isArray(docId) ? docId[0] : docId;

      const cleanDocId = rawId
        ? rawId.replace(/\.[^/.]+$/, "")
        : "";

      const workspaceId =
        localStorage.getItem("workspace_id") || "";

      await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:8000"
        }/api/documents/${cleanDocId}/autosave`,
        {
          title: title || "Untitled Document",
          content: editor.getHTML(),
          workspace_id: workspaceId,
        }
      );

      setStatus("Saved");
      router.push("/documents");
    } catch (error) {
      console.error("Save & exit failed:", error);
      setStatus("Error saving");
    }
  };

  // Navigate to Version History
  const handleVersionHistory = () => {
    const rawId = Array.isArray(docId) ? docId[0] : docId;

    const cleanDocId = rawId
      ? rawId.replace(/\.[^/.]+$/, "")
      : "";

    router.push(`/documents/${cleanDocId}/versions`);
  };

  // Handle image upload and insertion into editor
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000";

    try {
      setStatus("Uploading image...");

      const res = await axios.post(
        `${apiBase}/api/files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData = res.data.data || res.data;
      const fileId = responseData.id;

      let imageUrl = responseData.file_url;

      if (fileId) {
        try {
          const downloadRes = await axios.get(
            `${apiBase}/api/files/${fileId}/download`
          );

          if (downloadRes.data?.data?.file_url) {
            imageUrl = downloadRes.data.data.file_url;
          }
        } catch (err) {
          console.error(
            "Could not fetch download URL, falling back to file_url",
            err
          );
        }
      }

      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `${apiBase}${
          imageUrl.startsWith("/") ? "" : "/"
        }${imageUrl}`;
      }

      if (editor && imageUrl) {
        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl })
          .run();
      }

      if (isInitialized) {
        const updatedContent = editor.getHTML();

        setStatus("Saving...");

        await saveToServer(updatedContent, title);
      }

      setStatus("Saved");
    } catch (err) {
      console.error("Image upload failed:", err);
      setStatus("Error uploading image");
    }
  };

  // Insert or edit hyperlink
  const setLink = () => {
    if (!editor) return;

    const previousUrl =
      editor.getAttributes("link").href;

    const url = window.prompt(
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
        .extendMarkRange("link")
        .unsetLink()
        .run();

      return;
    }

    const { from, to } = editor.state.selection;

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
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  // Handle file attachment upload and insertion as absolute link
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000";

    try {
      setStatus("Uploading file...");

      const res = await axios.post(
        `${apiBase}/api/files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData = res.data.data || res.data;

      const fileId = responseData.id;

      const fileName =
        responseData.file_name || file.name;

      // Absolute backend download URL to prevent Next.js routing interception
      const fileUrl = `${apiBase}/api/files/${fileId}/download`;

      const fileEntry = {
        id: fileId,
        name: fileName,
        url: fileUrl,
      };

      setAttachedFiles((prev) => [
        ...prev,
        fileEntry,
      ]);

      if (editor) {
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

      setStatus("Error uploading file");
    }
  };

  if (!editor) return null;

  const rawDocId = Array.isArray(docId)
    ? docId[0]
    : docId;

  const cleanDocId = rawDocId
    ? rawDocId.replace(/\.[^/.]+$/, "")
    : "";

  return (
    <div className="h-screen bg-[#FBFBFA] flex flex-col overflow-hidden text-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-3 flex justify-between items-center shadow-sm shrink-0">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-lg font-semibold bg-transparent focus:outline-none w-1/3 text-gray-900"
          placeholder="Document Title..."
        />

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {status}
          </span>

          {/* Share */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="bg-[#2f6f68] text-white text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition shadow-sm cursor-pointer"
          >
            Share
          </button>

          {/* Comments */}
          <button
            type="button"
            onClick={() => {
              router.push(
                `/documents/${cleanDocId}/comments`
              );
            }}
            className="border border-gray-300 bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Comments
          </button>

          {/* Version History */}
          <button
            type="button"
            onClick={handleVersionHistory}
            className="border border-gray-300 bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Version History
          </button>

          {/* Save & Exit */}
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <div className="bg-white border-b border-gray-200 px-8 py-2.5 flex flex-wrap gap-1.5 text-xs font-medium text-gray-700 shadow-sm items-center shrink-0">
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 1 })
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive("heading", { level: 1 })
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          H1
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          className={`px-2.5 py-1 border rounded transition cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          H2
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1"></span>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={`px-2.5 py-1 border rounded transition font-bold cursor-pointer ${
            editor.isActive("bold")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          B
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={`px-2.5 py-1 border rounded transition italic cursor-pointer ${
            editor.isActive("italic")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleUnderline().run()
          }
          className={`px-2.5 py-1 border rounded transition underline cursor-pointer ${
            editor.isActive("underline")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          U
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1"></span>

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
            editor.isActive("bulletList")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Bullet List
        </button>

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
            editor.isActive("orderedList")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Numbered List
        </button>

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
            editor.isActive("blockquote")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Quote
        </button>

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
            editor.isActive("codeBlock")
              ? "bg-black text-white"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Code Block
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1"></span>

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

        <label className="px-2.5 py-1 border rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
          Image

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <label className="px-2.5 py-1 border rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
          Attach File

          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Editor */}
      <main className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">
        <div className="max-w-4xl w-full bg-white p-8 border border-gray-200 rounded-xl shadow-sm h-fit mb-12">
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Share Dialog */}
      {isShareModalOpen && (
        <ShareDialog
          documentId={cleanDocId}
          documentName={title || "Untitled Document"}
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}