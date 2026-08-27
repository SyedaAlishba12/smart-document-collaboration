'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function EditorPage() {
  const params = useParams();
  const docId = params.id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Saved');

  // Fetch initial document data
  useEffect(() => {
    if (docId) {
      axios.get(`http://localhost:8000/api/documents/${docId}`)
        .then((res) => {
          setTitle(res.data.data.title || 'Untitled');
          setContent(res.data.data.content || '');
        })
        .catch((err) => console.error('Error loading doc:', err));
    }
  }, [docId]);

  // Autosave function call
  const saveToServer = useCallback(async (currentContent: string, currentTitle: string) => {
    setStatus('Saving...');
    try {
      await axios.post(`http://localhost:8000/api/documents/${docId}/autosave`, {
        title: currentTitle,
        content: currentContent,
      });
      setStatus('Saved');
    } catch (error) {
      console.error('Autosave failed:', error);
      setStatus('Error saving');
    }
  }, [docId]);

  // Debounce logic for autosave (Avoids request on every keystroke)
  useEffect(() => {
    if (!docId) return;
    setStatus('Unsaved changes...');
    const timer = setTimeout(() => {
      saveToServer(content, title);
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
  }, [content, title, docId, saveToServer]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col text-[#1A1A1A]">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white px-8 py-3 flex justify-between items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent focus:outline-none w-1/2"
        />
        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {status}
        </div>
      </header>

      {/* Editor Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 bg-white my-6 border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your document content here..."
          className="w-full flex-1 resize-none focus:outline-none text-base text-gray-800 leading-relaxed font-sans"
        />
      </main>
    </div>
  );
}