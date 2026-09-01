'use client';

import React, { useState } from 'react';
import { Info, Edit2, Download, Trash2 } from 'lucide-react';

interface FileItemProps {
  id: string;
  name: string;
  size?: string;
  type?: string;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onViewMetadata: (id: string) => void;
}

export default function FileItem({ 
  id, 
  name, 
  size = '0 MB', 
  type = 'FILE', 
  onDownload, 
  onDelete, 
  onRename, 
  onViewMetadata 
}: FileItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);

  const handleSaveRename = () => {
    if (newName.trim() && newName !== name) {
      onRename(id, newName);
    }
    setIsEditing(false);
  };

  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between hover:border-[var(--primary)] hover:shadow-md transition">
      <div className="flex items-center gap-3 truncate flex-1 mr-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] group-hover:bg-black group-hover:text-white transition flex-shrink-0">
          📎
        </div>
        <div className="truncate flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-none w-full max-w-xs focus:border-black"
                autoFocus
              />
              <button 
                onClick={handleSaveRename}
                className="text-xs bg-black text-white px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-800"
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">{name}</h4>
          )}
          <p className="text-xs text-[var(--muted)] mt-0.5">{type.toUpperCase()} • {size}</p>
        </div>
      </div>

      {/* Clean Lucide Icons without Move */}
      <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
        <button
          onClick={() => onViewMetadata(id)}
          className="p-2 hover:text-black rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title="Info & Metadata"
        >
          <Info className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
          title="Rename File"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDownload(id)}
          className="p-2 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
          title="Download File"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-2 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
          title="Delete File"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}