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

  // 1. Fetch initial document data for recovery
  useEffect(() => {
    if (documentId) {
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/documents/${documentId}`)
        .then((res) => {
          setTitle(res.data.data.title || '');
          setContent(res.data.data.content || '');
        })
        .catch((err) => console.error('Failed to load document:', err));
    }
  }, [documentId]);

  // 2. Autosave API call function
  const saveContent = useCallback(async (currentContent: string, currentTitle: string) => {
    setStatus('Saving...');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/documents/${documentId}/autosave`, {
        title: currentTitle,
        content: currentContent,
      });
      setStatus('Saved');
    } catch (err) {
      console.error('Autosave error:', err);
      setStatus('Error saving');
    }
  }, [documentId]);

  // 3. Debounced Autosave Logic (Avoids request on every keystroke)
  useEffect(() => {
    if (!documentId) return;
    setStatus('Unsaved changes...');
    const timer = setTimeout(() => {
      saveContent(content, title);
    }, 1500); // 1.5 seconds debounce delay

    return () => clearTimeout(timer);
  }, [content, title, documentId, saveContent]);

  // Helper function to insert basic formatting tags into textarea content
  const insertFormatting = (tagOpen: string, tagClose: string) => {
    const textarea = document.getElementById('rich-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const updatedContent = content.substring(0, start) + tagOpen + selectedText + tagClose + content.substring(end);
    
    setContent(updatedContent);
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFBFA]">
      {/* Header & Status Indicator */}
      <header className="border-b border-gray-200 bg-white px-8 py-3 flex justify-between items-center shadow-sm">
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

      {/* Formatting Toolbar for Rich-Text Support */}
      <div className="bg-white border-b border-gray-200 px-8 py-2 flex flex-wrap gap-2 text-xs font-medium text-gray-700 shadow-sm">
        <button onClick={() => insertFormatting('<h1>', '</h1>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition">H1</button>
        <button onClick={() => insertFormatting('<h2>', '</h2>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition">H2</button>
        <button onClick={() => insertFormatting('<strong>', '</strong>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition font-bold">B</button>
        <button onClick={() => insertFormatting('<em>', '</em>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition italic">I</button>
        <button onClick={() => insertFormatting('<u>', '</u>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition underline">U</button>
        <button onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition">List</button>
        <button onClick={() => insertFormatting('<blockquote>', '</blockquote>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition">Quote</button>
        <button onClick={() => insertFormatting('<pre><code>', '</code></pre>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition font-mono">Code</button>
        <button onClick={() => insertFormatting('<a href="URL">', '</a>')} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border rounded transition">Link</button>
      </div>

      {/* Editor Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 bg-white my-6 border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <textarea
          id="rich-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your content or use toolbar formatting above..."
          className="w-full flex-1 resize-none focus:outline-none text-base text-gray-800 leading-relaxed font-sans"
        />
      </main>
    </div>
  );
}