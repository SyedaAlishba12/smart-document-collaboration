'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import FileItem from '@/components/files/FileItem';
import { useRouter } from 'next/navigation';

interface FileData {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 1. Initialize Real Auth Token
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      router.push('/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchFiles();
  }, [router]);

  // 2. Fetch files list with real authorization
  const fetchFiles = async () => {
    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/files`);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setFiles(data);
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.response?.data?.detail || 'Failed to load files from server.');
    }
  };

  // 3. Handle File Upload with Type & Size Validation (Backend handles uploader via token)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Supported formats: PDF, DOCX, XLSX, PNG, JPG');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('File uploaded successfully!');
      fetchFiles();
    } catch (err: any) {
      console.error('File upload failed:', err);
      setError(err.response?.data?.detail || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // 4. Download File Handler
  const handleDownload = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/files/${id}/download`);
      const fileUrl = res.data.data?.file_url || res.data.file_url;
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Download failed:', err);
      alert('Could not retrieve download link.');
    }
  };

  // 5. Delete File Handler
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/files/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Failed to delete file.');
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        {/* Top Header matching Folders/Documents Style */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="File Management"
            description="Upload and manage attachments (PDF, DOCX, XLSX, PNG, JPG) securely via Cloudflare R2."
          />

          <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition cursor-pointer shadow-sm">
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
            <span className="text-2xl mb-2">📁</span>
            <p className="font-medium text-gray-700">No files uploaded yet</p>
            <p className="text-[11px] text-gray-400 mt-1">Get started by uploading your first document or asset above.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file) => (
              <FileItem
                key={file.id}
                id={file.id}
                name={file.file_name}
                size={`${(file.file_size / (1024 * 1024)).toFixed(2)} MB`}
                type={file.file_type.includes('pdf') ? 'PDF' : file.file_type.includes('sheet') ? 'XLSX' : file.file_type.includes('word') ? 'DOCX' : 'Image'}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}