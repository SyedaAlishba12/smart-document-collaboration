'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { FileText, Plus, Trash2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface DocumentItem {
  id: string;
  title: string;
  content?: string;
  workspace_id: string;
  folder_id?: string;
  is_favorite?: boolean;
  is_archived?: boolean;
  updated_at?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const router = useRouter();

  // 1. Initialize Real Auth Token & Dynamic Workspace ID from Backend
  useEffect(() => {
    const initAuthAndWorkspace = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        router.push('/login');
        return;
      }

      // Set global Axios authorization header matching Fatima's security dependency
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        // Fetch real workspaces belonging to the authenticated user
        const res = await axios.get(`${API_BASE_URL}/api/workspaces`);
        const workspaces = res.data.data || res.data || [];
        
        if (Array.isArray(workspaces) && workspaces.length > 0) {
          const activeWsId = localStorage.getItem('workspace_id') || workspaces[0].id;
          setWorkspaceId(activeWsId);
          localStorage.setItem('workspace_id', activeWsId);
        } else {
          setError('No workspaces found. Please create a workspace first.');
        }
      } catch (err: any) {
        console.error('Error fetching workspaces:', err);
        setError('Failed to resolve active workspace session.');
      }
    };

    initAuthAndWorkspace();
  }, [router]);

  // 2. Fetch Documents Listing for the Active Workspace
  const fetchDocuments = async () => {
    if (!workspaceId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/documents?workspace_id=${workspaceId}`);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.detail || 'Failed to load documents from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments();
    }
  }, [workspaceId]);

  // 3. Create Document with Real Workspace ID
  const handleCreateDocument = async () => {
    if (!workspaceId) {
      alert('Active workspace ID is missing.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/documents`, {
        title: 'Untitled Document',
        content: '',
        workspace_id: workspaceId,
      });
      const newDocId = response.data.data?.id || response.data.id;
      if (newDocId) {
        router.push(`/editor/${newDocId}`);
      }
    } catch (err: any) {
      console.error('Error creating document:', err);
      alert(`Failed to create document: ${err.response?.data?.detail || err.message}`);
    }
  };

  // 4. Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, docId: string, currentFav?: boolean) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_BASE_URL}/api/documents/${docId}/favorite`, {
        is_favorite: !currentFav,
      });
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, is_favorite: !currentFav } : doc))
      );
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
    }
  };

  // 5. Delete Document
  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/documents/${docId}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="Documents Manager"
            description="Create, collaborate, edit, and organize your smart documents seamlessly."
          />

          <button
            onClick={handleCreateDocument}
            disabled={!workspaceId}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> New Document
          </button>
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
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
            <FileText className="h-8 w-8 text-[var(--muted-light)] mb-2" />
            <p className="font-medium text-gray-700">No documents found</p>
            <p className="text-[11px] text-gray-400 mt-1">Get started by creating your very first document above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor/${doc.id}`)}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:bg-black group-hover:text-white transition">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleFavorite(e, doc.id, doc.is_favorite)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          doc.is_favorite ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title="Favorite"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteDocument(e, doc.id)}
                        className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {doc.title || 'Untitled Document'}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                      {doc.content ? doc.content.substring(0, 90) + '...' : 'Empty document content...'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-light)]">
                  <span className="truncate max-w-[150px]">ID: {doc.id.slice(0, 8)}...</span>
                  <span className="font-medium text-[var(--primary)] group-hover:translate-x-0.5 transition">Open Editor →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}