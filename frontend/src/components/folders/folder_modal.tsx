'use client';

import React, { useState } from 'react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function FolderModal({
  isOpen,
  onClose,
  onSubmit,
}: FolderModalProps) {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const name = folderName.trim();

    if (!name) return;

    onSubmit(name);
    setFolderName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Folder
        </h3>

        <input
          type="text"
          placeholder="Folder name..."
          value={folderName}
          onChange={(e) =>
            setFolderName(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black mb-6"
        />

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!folderName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            Create
          </button>

        </div>
      </div>
    </div>
  );
}