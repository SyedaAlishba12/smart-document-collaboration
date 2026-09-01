'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import FileItem from '@/components/files/FileItem';
import { useRouter } from 'next/navigation';
import { Plus, Info } from 'lucide-react';

interface FileData {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  workspace_id?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedMetadata, setSelectedMetadata] = useState<any | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        router.push('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const wsRes = await axios.get(`${API_BASE_URL}/api/workspaces`);
        const workspaces = wsRes.data.data || wsRes.data || [];
        if (Array.isArray(workspaces) && workspaces.length > 0) {
          const activeWsId = localStorage.getItem('workspace_id') || workspaces[0].id;
          setWorkspaceId(activeWsId);
          localStorage.setItem('workspace_id', activeWsId);
          fetchFiles(activeWsId);
        } else {
          fetchFiles();
        }
      } catch (err) {
        console.error('Workspace resolution failed:', err);
        fetchFiles();
      }
    };

    initSession();
  }, [router]);

  const fetchFiles = async (wsId?: string) => {
    try {
      setError('');
      const endpoint = wsId 
        ? `${API_BASE_URL}/api/files?workspace_id=${wsId}` 
        : `${API_BASE_URL}/api/files`;
      const response = await axios.get(endpoint);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setFiles(data);
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.response?.data?.detail || 'Failed to load files from server.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const userId = localStorage.getItem('user_id');
    if (userId) {
      formData.append('uploader_id', userId);
    }
    if (workspaceId) {
      formData.append('workspace_id', workspaceId);
    }

    setUploading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles(workspaceId);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setError(err.response?.data?.detail || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Robust download handler with Blob support to avoid NoSuchKey xml browser views
  const handleDownload = async (id: string) => {
    try {
      const targetFile = files.find(f => f.id === id);
      const fileName = targetFile?.file_name || 'download';

      const res = await axios.get(`${API_BASE_URL}/api/files/${id}/download`, {
        validateStatus: (status) => status < 500
      });

      if (res.status >= 400) {
        throw new Error(res.data?.detail || 'Storage object missing or invalid download link.');
      }

      const fileUrl = res.data.data?.file_url || res.data.file_url || res.data.data;
      
      if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
        try {
          const response = await axios.get(fileUrl, { responseType: 'blob' });
          const blob = new Blob([response.data]);
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch {
          window.open(fileUrl, '_blank');
          return;
        }
      }

      alert('Download URL not found or invalid format returned.');
    } catch (err: any) {
      console.error('Download failed:', err);
      alert(err.message || 'Could not retrieve download link. The storage object might be missing from the bucket.');
    }
  };

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

  const handleRename = async (id: string, newName: string) => {
    try {
      await axios.put(`${API_BASE_URL}/api/files/${id}`, { file_name: newName });
      fetchFiles(workspaceId);
    } catch (err: any) {
      console.error('Rename failed:', err);
      alert(err.response?.data?.detail || 'Failed to rename file.');
    }
  };

  const handleViewMetadata = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/files/${id}/metadata`);
      setSelectedMetadata(res.data.data || res.data);
    } catch (err: any) {
      console.error('Failed to fetch metadata:', err);
      const currentFile = files.find(f => f.id === id);
      if (currentFile) {
        setSelectedMetadata(currentFile);
      } else {
        alert('Could not retrieve file metadata.');
      }
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="File Management"
            description="Upload, organize, and manage your attachments securely."
          />

          <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition cursor-pointer shadow-sm">
            <Plus className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
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
            <p className="font-medium text-gray-700">No files found</p>
            <p className="text-[11px] text-gray-400 mt-1">Upload files to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file) => (
              <FileItem
                key={file.id}
                id={file.id}
                name={file.file_name}
                size={`${((file.file_size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                type={file.file_type || 'FILE'}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onRename={handleRename}
                onViewMetadata={handleViewMetadata}
              />
            ))}
          </div>
        )}

        {/* File Metadata & Info Modal */}
        {selectedMetadata && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-gray-900">
                  <Info className="h-4 w-4 text-indigo-600" /> File Metadata & Details
                </h3>
                <button onClick={() => setSelectedMetadata(null)} className="text-gray-400 hover:text-black text-sm p-1 font-semibold cursor-pointer">✕</button>
              </div>
              <div className="space-y-2.5 text-xs text-gray-600">
                <p><strong>File Name:</strong> <span className="text-black font-medium">{selectedMetadata.file_name}</span></p>
                <p><strong>File Size:</strong> {((selectedMetadata.file_size || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                <p><strong>File Type:</strong> {selectedMetadata.file_type || 'Unknown'}</p>
                <p><strong>File ID:</strong> <span className="font-mono text-[11px]">{selectedMetadata.id}</span></p>
                <p><strong>Workspace ID:</strong> <span className="font-mono text-[11px]">{selectedMetadata.workspace_id || workspaceId}</span></p>
              </div>
              <div className="mt-6 flex justify-end pt-2 border-t">
                <button onClick={() => setSelectedMetadata(null)} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}