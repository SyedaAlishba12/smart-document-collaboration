'use client';

import React from 'react';

interface FileItemProps {
  id: string;
  name: string;
  size?: string;
  type?: string;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FileItem({ id, name, size = '0 MB', type = 'FILE', onDownload, onDelete }: FileItemProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 transition">
      <div className="flex items-center gap-3 truncate">
        <span className="text-xl p-2 bg-gray-50 rounded-lg">📎</span>
        <div className="truncate">
          <h4 className="font-medium text-sm text-gray-800 truncate">{name}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{type.toUpperCase()} • {size}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(id)}
          className="text-xs text-gray-600 hover:text-black font-medium px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg transition cursor-pointer"
        >
          Download
        </button>
        <button
          onClick={() => onDelete(id)}
          className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg transition cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}