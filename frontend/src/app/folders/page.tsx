'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const storedWorkspaceId =
      localStorage.getItem('workspace_id');

    setWorkspaceId(storedWorkspaceId);
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchFolders();
    } else {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchFolders = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `${API_BASE_URL}/api/folders/workspace/${workspaceId}`
      );

      setFolders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Unable to load folders.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!newFolderName.trim() || !workspaceId) {
      return;
    }

    try {
      setError('');

      await axios.post(
        `${API_BASE_URL}/api/folders`,
        {
          workspace_id: workspaceId,
          parent_folder_id: null,
          name: newFolderName.trim(),
        }
      );

      setNewFolderName('');
      await fetchFolders();

    } catch (error) {
      console.error(
        'Error creating folder:',
        error
      );

      setError('Unable to create folder.');
    }
  };

  const handleDeleteFolder = async (
    folderId: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this folder?'
    );

    if (!confirmed) return;

    try {
      setError('');

      await axios.delete(
        `${API_BASE_URL}/api/folders/${folderId}`
      );

      await fetchFolders();

    } catch (error) {
      console.error(
        'Error deleting folder:',
        error
      );

      setError('Unable to delete folder.');
    }
  };

  if (!workspaceId && !loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] p-8 text-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold">
            Folders
          </h1>

          <p className="mt-2 text-sm text-red-500">
            No workspace selected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8 text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Folders
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Organize your workspace documents and
              subfolders efficiently.
            </p>
          </div>

          {/* Create Folder */}
          <form
            onSubmit={handleCreateFolder}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="New folder name..."
              value={newFolderName}
              onChange={(e) =>
                setNewFolderName(e.target.value)
              }
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />

            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              + Create Folder
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-sm text-gray-400">
            Loading folders...
          </div>
        ) : folders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
            No folders found. Create your first folder
            above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 transition shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    📁
                  </span>

                  <span className="font-medium text-sm text-gray-800">
                    {folder.name}
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleDeleteFolder(folder.id)
                  }
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1 bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}