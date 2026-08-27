'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface DocumentItem {
  id: string;
  title: string;
  is_favorite?: boolean;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`);
      setDocuments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

const handleCreateDocument = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workspaces`); 
        const responsePost = await axios.post(`${API_URL}/api/documents`, {
        title: 'Untitled Document',
        content: '',
        workspace_id: '11111111-1111-1111-1111-111111111111', // Default valid UUID
      });
      const newDocId = responsePost.data.data?.id || responsePost.data.id;
      if (newDocId) {
        router.push(`/editor/${newDocId}`);
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      alert(`Failed to create document: ${error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : error.message}`);
    }
  };
    return (
    <div className="min-h-screen bg-[#FBFBFA] p-8 text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and organize your documents.</p>
          </div>
          <button
            onClick={handleCreateDocument}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition shadow-sm"
          >
            + New document
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm shadow-sm">
            No documents found. Click &quot;+ New document&quot; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor/${doc.id}`)}
                className="bg-white border border-gray-200/80 rounded-xl p-5 hover:border-black cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <span className="font-medium text-sm text-gray-800 truncate">{doc.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}