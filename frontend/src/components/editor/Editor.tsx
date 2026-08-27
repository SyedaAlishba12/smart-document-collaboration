'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface EditorProps {
  documentId: string;
}

export default function Editor({ documentId }: EditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Saved');

  useEffect(() => {
    if (documentId) {
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${documentId}`)
        .then((res) => {
          setTitle(res.data.data.title || '');
          setContent(res.data.data.content || '');
        })
        .catch((err) => console.error('Failed to load document:', err));
    }
  }, [documentId]);

  const saveContent = useCallback(async (currentContent: string, currentTitle: string) => {
    setStatus('Saving...');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${documentId}/autosave`, {
        title: currentTitle,
        content: currentContent,
      });
      setStatus('Saved');
    } catch (err) {
      console.error('Autosave error:', err);
      setStatus('Error saving');
    }
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;
    setStatus('Unsaved changes...');
    const timer = setTimeout(() => {
      saveContent(content, title);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, documentId, saveContent]);

  return (
    <div className="flex flex-col h-full bg-[#FBFBFA]">
      <header className="border-b border-gray-200 bg-white px-8 py-3 flex justify-between items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent focus:outline-none w-1/2 text-gray-900"
          placeholder="Document Title..."
        />
        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {status}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 bg-white my-6 border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your content here..."
          className="w-full flex-1 resize-none focus:outline-none text-base text-gray-800 leading-relaxed font-sans"
        />
      </main>
    </div>
  );
}