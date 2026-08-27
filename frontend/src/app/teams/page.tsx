'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Team {
  id: string;
  name: string;
  description?: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/teams');
      setTeams(response.data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await axios.post('http://localhost:8000/api/teams', { name: teamName });
      setTeamName('');
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8 text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
            <p className="text-sm text-gray-500 mt-1">Manage collaborative teams and member access.</p>
          </div>
          
          <form onSubmit={handleCreateTeam} className="flex gap-2">
            <input
              type="text"
              placeholder="Team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
            >
              + Create Team
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
            No teams found. Create your first team above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900">{team.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Collaborative workspace team</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}