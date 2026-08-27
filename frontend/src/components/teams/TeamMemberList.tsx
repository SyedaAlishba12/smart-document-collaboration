'use client';

import React from 'react';

interface Member {
  id: string;
  email: string;
  role: string;
}

interface TeamMemberListProps {
  members: Member[];
  onRemove: (userId: string) => void;
}

export default function TeamMemberList({ members, onRemove }: TeamMemberListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Team Members</h3>
      {members.length === 0 ? (
        <p className="text-xs text-gray-400">No members added to this team yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
              <div>
                <p className="text-sm font-medium text-gray-800">{member.email}</p>
                <p className="text-xs text-gray-400 capitalize">{member.role}</p>
              </div>
              <button
                onClick={() => onRemove(member.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}