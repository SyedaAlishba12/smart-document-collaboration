'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Folder, Plus, Trash2, Edit2, ChevronRight, ArrowLeft, FolderInput } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface FolderItem {
  id: string;
  name: string;
  workspace_id?: string;
  parent_folder_id?: string | null;
  created_at?: string;
  updated_at?: string;
  documentCount?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function FoldersPage() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root Folders' }
  ]);

  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const router = useRouter();

  // 1. Initialize Authentication Token and Dynamic Workspace ID
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      router.push('/login');
      return;
    }

    // Set global authorization header for axios requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    initWorkspace();
  }, [router]);

  // 2. Fetch active workspace dynamically from the server without hardcoding
  const initWorkspace = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/workspaces`);
      const workspaces = res.data.data || res.data || [];
      
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        const validId = workspaces[0].id;
        setWorkspaceId(validId);
        localStorage.setItem('workspace_id', validId);
        return;
      }
      setError('No active workspaces found for this user account.');
    } catch (err: any) {
      console.error('Failed to fetch workspaces:', err);
      setError('Could not retrieve your workspace. Please check your connection or re-login.');
    }
  };

  // 3. Fetch folders list for the current workspace
  const fetchFolders = async () => {
    if (!workspaceId) return;
    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/folders/workspace/${workspaceId}`);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setFolders(data);
      }
    } catch (err: any) {
      console.warn('Fetch folders error:', err);
      setError(err.response?.data?.detail || 'Failed to load folders from server.');
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchFolders();
    }
  }, [workspaceId]);

  // 4. Handle creation of a new folder or subfolder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const folderName = newFolderName.trim();
    setNewFolderName('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/folders`, {
        workspace_id: workspaceId,
        parent_folder_id: currentParentId,
        name: folderName,
      });
      
      if (response.data) {
        await fetchFolders();
      }
    } catch (err: any) {
      console.error('Backend folder creation error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to create folder.');
    }
  };

  // 5. Handle deletion of an existing folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/folders/${folderId}`);
      setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parent_folder_id !== folderId));
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.detail || 'Failed to delete folder.');
    }
  };

  // 6. Handle renaming an existing folder
  const handleRenameFolder = async (folderId: string) => {
    if (!editingName.trim()) return;

    try {
      await axios.put(`${API_BASE_URL}/api/folders/${folderId}`, {
        name: editingName.trim()
      });
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: editingName.trim() } : f))
      );
      setEditingFolderId(null);
      setEditingName('');
    } catch (err: any) {
      console.error('Rename error:', err);
      alert(err.response?.data?.detail || 'Failed to rename folder.');
    }
  };

  // 7. Handle moving a folder to a new parent folder or root level
  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    try {
      await axios.post(`${API_BASE_URL}/api/folders/${folderId}/move`, {
        parent_folder_id: newParentId
      });
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, parent_folder_id: newParentId } : f))
      );
      setMovingFolderId(null);
    } catch (err: any) {
      console.error('Move error:', err);
      alert(err.response?.data?.detail || 'Failed to move folder.');
    }
  };

  const displayedFolders = folders.filter((f) => (f.parent_folder_id || null) === currentParentId);

  // 8. Navigation handler to open a subfolder
  const handleOpenFolder = (folder: FolderItem) => {
    setCurrentParentId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  // 9. Navigation handler to go back via breadcrumbs
  const handleBackNavigation = (index: number) => {
    const targetPath = folderPath[index];
    setCurrentParentId(targetPath.id);
    setFolderPath(folderPath.slice(0, index + 1));
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="Folders"
            description="Organize your workspace documents and subfolders efficiently."
          />

          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <input
              type="text"
              placeholder={currentParentId ? "New subfolder name..." : "New folder name..."}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="px-4 py-2 text-xs bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {currentParentId ? 'Create Subfolder' : 'Create Folder'}
            </button>
          </form>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="flex items-center gap-2 mb-6 text-xs text-[var(--muted)] bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
          {folderPath.map((pathItem, idx) => (
            <React.Fragment key={pathItem.id || 'root'}>
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-light)]" />}
              <button
                onClick={() => handleBackNavigation(idx)}
                className={`hover:text-[var(--primary)] transition font-medium cursor-pointer ${
                  idx === folderPath.length - 1 ? 'text-[var(--foreground)] font-semibold' : ''
                }`}
              >
                {pathItem.name}
              </button>
            </React.Fragment>
          ))}
          {currentParentId && (
            <button
              onClick={() => handleBackNavigation(folderPath.length - 2)}
              className="ml-auto flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {displayedFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
            <Folder className="h-8 w-8 text-[var(--muted-light)] mb-2" />
            <p>No folders found in this workspace level. Create one above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayedFolders.map((folder) => (
              <div key={folder.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Folder className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMovingFolderId(movingFolderId === folder.id ? null : folder.id)}
                        className="p-1.5 text-gray-400 hover:text-[var(--primary)] rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        title="Move folder"
                      >
                        <FolderInput className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditingName(folder.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        title="Rename folder"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete folder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {editingFolderId === folder.id ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameFolder(folder.id)}
                        className="px-2.5 py-1 text-xs bg-[var(--primary)] text-white rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)] truncate">
                      {folder.name}
                    </h3>
                  )}

                  {movingFolderId === folder.id && (
                    <div className="mt-3 p-2 bg-gray-50 border rounded-xl text-xs">
                      <p className="text-[10px] font-medium text-gray-500 mb-1">Move to parent:</p>
                      <select
                        onChange={(e) => handleMoveFolder(folder.id, e.target.value === 'root' ? null : e.target.value)}
                        className="w-full p-1 bg-white border rounded-lg text-xs cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Select destination...</option>
                        <option value="root">Root (Top Level)</option>
                        {folders
                          .filter((f) => f.id !== folder.id)
                          .map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted-light)]">
                  <span>ID: {folder.id.slice(0, 8)}...</span>
                  <button
                    onClick={() => handleOpenFolder(folder)}
                    className="font-medium text-[var(--primary)] cursor-pointer hover:underline"
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}