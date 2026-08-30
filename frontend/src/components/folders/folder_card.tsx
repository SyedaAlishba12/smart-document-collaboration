'use client';

import React from 'react';

interface FolderCardProps {
  id: string;
  name: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FolderCard({
  id,
  name,
  onOpen,
  onDelete,
}: FolderCardProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 hover:border-black transition shadow-sm flex items-center justify-between">

      <button
        type="button"
        onClick={() => onOpen(id)}
        className="flex items-center gap-3 cursor-pointer flex-1 text-left"
      >
        <span className="text-xl">📁</span>

        <span className="font-medium text-sm text-gray-800">
          {name}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onDelete(id)}
        className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1 bg-red-50 rounded-lg"
      >
        Delete
      </button>

    </div>
  );
}