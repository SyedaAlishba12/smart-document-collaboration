'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface DocumentItem {
  id: string;
  title: string;
  content?: string;
  updated_at?: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents`);
      setDocuments(res.data.data || res.data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents from server.');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents`, {
        title: 'Untitled Document',
        content: '',
      });
      const newDocId = res.data.data?.id || res.data.id;
      if (newDocId) {
        router.push(`/editor/${newDocId}`);
      }
    } catch (err: any) {
      console.error('Error creating document:', err);
      alert(`Could not create document. Server responded with: ${err.response?.statusText || '405 Method Not Allowed check backend route.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBFBFA] to-[#F4F4F2] p-8 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span>📄</span> Documents Workspace
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, collaborate, edit, and organize your smart documents seamlessly.
            </p>
          </div>
          <button
            onClick={createDocument}
            className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New Document
          </button>
        </div>

        {/* Error Banner if any */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-sm text-gray-400">
            Loading your documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-3xl flex items-center justify-center mx-auto rounded-full shadow-inner">
              📂
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-gray-800">No documents found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Get started by creating your very first document using the button above.
              </p>
            </div>
            <button
              onClick={createDocument}
              className="px-4 py-2 text-xs font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Create Document Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor/${doc.id}`)}
                className="bg-white border border-gray-200/80 rounded-2xl p-6 hover:border-black hover:shadow-md cursor-pointer transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg group-hover:bg-black group-hover:text-white transition">
                    📝
                  </div>
                  <h3 className="font-semibold text-base text-gray-800 truncate">
                    {doc.title || 'Untitled Document'}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {doc.content ? doc.content.substring(0, 80) + '...' : 'Empty document content...'}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Open Editor</span>
                  <span className="font-semibold text-black group-hover:translate-x-1 transition">→</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}