'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import {
  FileText,
  Plus,
  Trash2,
  Star,
  Edit2,
  Copy,
  FolderInput,
  Archive,
  RotateCcw,
  Info,
  Eye,
  Folder,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api_client';

interface DocumentItem {
  id: string;
  title: string;
  content?: string;
  workspace_id: string;
  folder_id?: string;
  is_favorite?: boolean;
  is_archived?: boolean;
  updated_at?: string;
  created_at?: string;
}

interface FolderItem {
  id: string;
  name: string;
  workspace_id: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Move Modal States
  const [moveModalDoc, setMoveModalDoc] =
    useState<DocumentItem | null>(null);

  const [viewMode, setViewMode] =
    useState<'active' | 'archived'>('active');

  const router = useRouter();

  // Initialize Auth & Active Workspace Session
  useEffect(() => {
    const initAuthAndWorkspace = async () => {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token');

      if (!token) {
        setError(
          'Authentication token missing. Please log in again.'
        );
        setLoading(false);
        router.push('/login');
        return;
      }

      // Preserve compatibility with the existing "token" storage key.
      // The shared api_client reads "access_token".
      if (!localStorage.getItem('access_token')) {
        localStorage.setItem('access_token', token);
      }

      try {
        const res = await api.get('/api/workspaces');

        const workspaces =
          res.data.data || res.data || [];

        if (
          Array.isArray(workspaces) &&
          workspaces.length > 0
        ) {
          const activeWsId =
            localStorage.getItem('workspace_id') ||
            workspaces[0].id;

          setWorkspaceId(activeWsId);
          localStorage.setItem(
            'workspace_id',
            activeWsId
          );
        } else {
          setError(
            'No workspaces found. Please create a workspace first.'
          );
        }
      } catch (err: any) {
        console.error(
          'Error fetching workspaces:',
          err
        );
        setError(
          'Failed to resolve active workspace session.'
        );
      }
    };

    initAuthAndWorkspace();
  }, [router]);

  // Fetch Documents & Folders Listing
  const fetchData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError('');

      // Fetch documents and workspace folders in parallel
      // using the shared authenticated API client.
      const [docRes, folderRes] =
        await Promise.all([
          api.get(
            `/api/documents?workspace_id=${workspaceId}`
          ),
          api
            .get(
              `/api/folders/workspace/${workspaceId}`
            )
            .catch(() => ({ data: [] })),
        ]);

      const docData =
        docRes.data.data ||
        docRes.data ||
        [];

      if (Array.isArray(docData)) {
        setDocuments(docData);
      }

      const folderData =
        folderRes.data.data ||
        folderRes.data ||
        [];

      if (Array.isArray(folderData)) {
        setFolders(folderData);
      }
    } catch (err: any) {
      console.error(
        'Error fetching data:',
        err
      );

      setError(
        err.response?.data?.detail ||
          'Failed to load documents from server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  // Helper to strip HTML tags for clean card preview text
  const stripHtmlTags = (html: string) => {
    if (!html) {
      return 'Empty document content...';
    }

    return html.replace(/<[^>]*>?/gm, '');
  };

  // Create Document
  const handleCreateDocument = async () => {
    const activeWorkspaceId =
      localStorage.getItem('workspace_id') ||
      workspaceId;

    try {
      const response = await api.post(
        '/api/documents',
        {
          title: 'Untitled Document',
          content: '<p></p>',
          workspace_id: activeWorkspaceId,
        }
      );

      const newDocId =
        response.data.data?.id ||
        response.data.id;

      if (newDocId) {
        router.push(`/editor/${newDocId}`);
      }
    } catch (error) {
      console.error(
        'Failed to create document:',
        error
      );
      alert('Could not create document.');
    }
  };

  // Rename Document
  const handleRenameDocument = async (
    e: React.MouseEvent,
    docId: string,
    currentTitle: string
  ) => {
    e.stopPropagation();

    const newTitle = prompt(
      'Enter new document title:',
      currentTitle
    );

    if (
      !newTitle ||
      newTitle.trim() === ''
    ) {
      return;
    }

    try {
      await api.put(
        `/api/documents/${docId}`,
        {
          title: newTitle.trim(),
        }
      );

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                title: newTitle.trim(),
              }
            : doc
        )
      );
    } catch (err) {
      console.error(
        'Error renaming document:',
        err
      );
      alert('Failed to rename document.');
    }
  };

  // Duplicate Document
  const handleDuplicateDocument = async (
    e: React.MouseEvent,
    doc: DocumentItem
  ) => {
    e.stopPropagation();

    try {
      const response = await api.post(
        '/api/documents',
        {
          title: `${doc.title} (Copy)`,
          content: doc.content || '',
          workspace_id: doc.workspace_id,
          folder_id:
            doc.folder_id || null,
        }
      );

      const duplicatedDoc =
        response.data.data ||
        response.data;

      setDocuments((prev) => [
        duplicatedDoc,
        ...prev,
      ]);
    } catch (err) {
      console.error(
        'Error duplicating document:',
        err
      );
      alert('Failed to duplicate document.');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (
    e: React.MouseEvent,
    docId: string,
    currentFav?: boolean
  ) => {
    e.stopPropagation();

    try {
      await api.post(
        `/api/documents/${docId}/favorite`,
        {
          is_favorite: !currentFav,
        }
      );

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                is_favorite: !currentFav,
              }
            : doc
        )
      );
    } catch (err) {
      console.error(
        'Error toggling favorite:',
        err
      );
    }
  };

  // Confirm and Execute Move Document to Target Folder
  const executeMoveDocument = async (
    targetFolderId: string | null
  ) => {
    if (!moveModalDoc) return;

    try {
      await api.post(
        `/api/documents/${moveModalDoc.id}/move`,
        {
          folder_id: targetFolderId,
        }
      );

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === moveModalDoc.id
            ? {
                ...doc,
                folder_id:
                  targetFolderId ||
                  undefined,
              }
            : doc
        )
      );

      setMoveModalDoc(null);

      alert(
        'Document moved successfully!'
      );
    } catch (err) {
      console.error(
        'Error moving document:',
        err
      );
      alert('Failed to move document.');
    }
  };

  // Archive / Unarchive Document
  const handleArchiveDocument = async (
    e: React.MouseEvent,
    docId: string,
    currentArchived?: boolean
  ) => {
    e.stopPropagation();

    try {
      await api.put(
        `/api/documents/${docId}`,
        {
          is_archived: !currentArchived,
        }
      );

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                is_archived:
                  !currentArchived,
              }
            : doc
        )
      );
    } catch (err) {
      console.error(
        'Error updating archive status:',
        err
      );
    }
  };

  // Delete Document
  const handleDeleteDocument = async (
    e: React.MouseEvent,
    docId: string
  ) => {
    e.stopPropagation();

    if (
      !window.confirm(
        'Are you sure you want to delete this document permanently?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/api/documents/${docId}`
      );

      setDocuments((prev) =>
        prev.filter(
          (doc) => doc.id !== docId
        )
      );
    } catch (err) {
      console.error(
        'Error deleting document:',
        err
      );
      alert('Failed to delete document.');
    }
  };

  // Filter documents based on active tab view mode.
  //
  // Active Documents:
  // Show ALL non-archived documents, including
  // documents that are inside folders/subfolders.
  //
  // Archived:
  // Show ALL archived documents.
  const filteredDocuments =
    documents.filter((doc) => {
      if (viewMode === 'archived') {
        return doc.is_archived;
      }

      return !doc.is_archived;
    });

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="Documents Manager"
            description="Create, collaborate, edit, and organize your smart documents seamlessly."
          />

          <div className="flex items-center gap-3">
            {/* View Mode Switcher Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() =>
                  setViewMode('active')
                }
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'active'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Active Documents
              </button>

              <button
                onClick={() =>
                  setViewMode('archived')
                }
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'archived'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <Archive className="h-3.5 w-3.5" />

                Archive (
                {
                  documents.filter(
                    (d) => d.is_archived
                  ).length
                }
                )
              </button>
            </div>

            <button
              onClick={
                handleCreateDocument
              }
              disabled={!workspaceId}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />

              New Document
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20 text-xs text-[var(--muted)]">
            Loading your documents...
          </div>
        ) : filteredDocuments.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
            <FileText className="h-8 w-8 text-[var(--muted-light)] mb-2" />

            <p className="font-medium text-gray-700">
              {viewMode === 'archived'
                ? 'No archived documents found'
                : 'No active documents found'}
            </p>

            <p className="text-[11px] text-gray-400 mt-1">
              {viewMode === 'archived'
                ? 'Documents you archive will appear here.'
                : 'Your active documents, including documents inside folders, will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map(
              (doc) => (
                <div
                  key={doc.id}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--primary)] hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:bg-black group-hover:text-white transition">
                        <FileText className="h-4 w-4" />
                      </div>

                      {/* Management Action Buttons Toolbar */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(
                              doc
                            );
                          }}
                          className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Document Preview & Metadata"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {viewMode ===
                          'active' && (
                          <>
                            <button
                              onClick={(e) =>
                                handleRenameDocument(
                                  e,
                                  doc.id,
                                  doc.title
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                              title="Rename Document"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={(e) =>
                                handleDuplicateDocument(
                                  e,
                                  doc
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                              title="Duplicate Document"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoveModalDoc(
                                  doc
                                );
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              title="Move Document"
                            >
                              <FolderInput className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={(e) =>
                                handleToggleFavorite(
                                  e,
                                  doc.id,
                                  doc.is_favorite
                                )
                              }
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                doc.is_favorite
                                  ? 'text-amber-500 bg-amber-50'
                                  : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                              }`}
                              title="Favorite"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) =>
                            handleArchiveDocument(
                              e,
                              doc.id,
                              doc.is_archived
                            )
                          }
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            doc.is_archived
                              ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                              : 'text-gray-300 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          title={
                            doc.is_archived
                              ? 'Restore from Archive'
                              : 'Archive Document'
                          }
                        >
                          {doc.is_archived ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) =>
                            handleDeleteDocument(
                              e,
                              doc.id
                            )
                          }
                          className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete Document Permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {doc.title ||
                          'Untitled Document'}
                      </h3>

                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                        {stripHtmlTags(
                          doc.content || ''
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-light)]">
                    <span className="truncate max-w-[150px]">
                      ID:{' '}
                      {doc.id.slice(
                        0,
                        8
                      )}
                      ...
                    </span>

                    <button
                      onClick={() =>
                        router.push(
                          `/editor/${doc.id}`
                        )
                      }
                      className="font-medium text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Open Editor →
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Move Document Modal */}
        {moveModalDoc && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-100">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FolderInput className="h-4 w-4 text-indigo-600" />
                  Move Document to Folder
                </h3>

                <button
                  onClick={() =>
                    setMoveModalDoc(null)
                  }
                  className="text-gray-400 hover:text-black text-sm font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Select a target folder for{' '}
                <span className="font-semibold text-black">
                  "{moveModalDoc.title}"
                </span>
                :
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() =>
                    executeMoveDocument(
                      null
                    )
                  }
                  className="w-full text-left px-3 py-2.5 rounded-xl border hover:bg-gray-50 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Folder className="h-4 w-4 text-gray-400" />
                  Root Directory (No Folder)
                </button>

                {folders.map(
                  (folder) => (
                    <button
                      key={folder.id}
                      onClick={() =>
                        executeMoveDocument(
                          folder.id
                        )
                      }
                      className="w-full text-left px-3 py-2.5 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50/50 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                    >
                      <Folder className="h-4 w-4 text-indigo-500" />
                      {folder.name}
                    </button>
                  )
                )}

                {folders.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">
                    No folders created in this workspace yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Metadata & Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-gray-100">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-black" />
                  Document Metadata & Preview
                </h3>

                <button
                  onClick={() =>
                    setPreviewDoc(null)
                  }
                  className="text-gray-400 hover:text-black text-sm font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <p>
                  <strong>Title:</strong>{' '}
                  {previewDoc.title}
                </p>

                <p>
                  <strong>
                    Document ID:
                  </strong>{' '}
                  {previewDoc.id}
                </p>

                <p>
                  <strong>
                    Workspace ID:
                  </strong>{' '}
                  {previewDoc.workspace_id}
                </p>

                <p>
                  <strong>Folder ID:</strong>{' '}
                  {previewDoc.folder_id ||
                    'Root (No Folder)'}
                </p>

                <p>
                  <strong>
                    Favorite:
                  </strong>{' '}
                  {previewDoc.is_favorite
                    ? 'Yes ⭐'
                    : 'No'}
                </p>

                <p>
                  <strong>
                    Archived:
                  </strong>{' '}
                  {previewDoc.is_archived
                    ? 'Yes 📦'
                    : 'No'}
                </p>

                <div className="pt-2 border-t">
                  <strong className="block mb-1 text-gray-800">
                    Content Preview:
                  </strong>

                  <div className="p-3 bg-gray-50 rounded-xl border max-h-32 overflow-y-auto text-gray-700">
                    {stripHtmlTags(
                      previewDoc.content ||
                        ''
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    const docId =
                      previewDoc.id;

                    setPreviewDoc(null);

                    router.push(
                      `/editor/${docId}`
                    );
                  }}
                  className="px-4 py-2 bg-black text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition cursor-pointer"
                >
                  Open in Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}