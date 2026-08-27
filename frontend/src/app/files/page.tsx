'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function FilesPage() {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post('http://localhost:8000/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8 text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">File Management</h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage attachments (PDF, DOCX, Images, etc.) securely.</p>
          </div>
          
          <label className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition cursor-pointer">
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          No files uploaded yet. Use the upload button above.
        </div>
      </div>
    </div>
  );
}