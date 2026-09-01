'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Users, Plus, Trash2, Edit2, UserMinus } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamItem {
  id: string;
  name: string;
  description?: string;
  workspace_id?: string;
  team_members?: TeamMember[];
}

interface WorkspaceUser {
  id: string;
  email: string;
  name?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');

  const [managingTeamId, setManagingTeamId] = useState<string | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  
  // State for member addition via email
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const router = useRouter();

  // 1. Initialize Authentication Token and Dynamic Workspace ID
  useEffect(() => {
    const initWorkspaceAndToken = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        router.push('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/workspaces`);
        const workspaces = res.data.data || res.data || [];
        
        if (Array.isArray(workspaces) && workspaces.length > 0) {
          const validId = workspaces[0].id;
          setWorkspaceId(validId);
          localStorage.setItem('workspace_id', validId);
          return;
        }
        setError('No active workspaces found for this user account.');
      } catch (err: any) {
        console.error('Failed to fetch workspaces:', err);
        setError('Could not retrieve your workspace. Please check your connection or re-login.');
      }
    };

    initWorkspaceAndToken();
  }, [router]);

  // 2. Fetch Teams for the active workspace
  const fetchTeams = async () => {
    if (!workspaceId) return;
    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/teams?workspace_id=${workspaceId}`);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setTeams(data);
      }
    } catch (err: any) {
      console.warn('Fetch teams error:', err);
      const errMsg = err.response?.data?.detail;
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to load teams from server.');
    }
  };

  // 3. Fetch Workspace Users for dropdown selection
  const fetchWorkspaceUsers = async () => {
    if (!workspaceId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/workspaces/${workspaceId}/users`);
      const usersData = response.data.data || response.data || [];
      if (Array.isArray(usersData)) {
        setWorkspaceUsers(usersData);
      }
    } catch (err) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users`);
        const usersData = response.data.data || response.data || [];
        if (Array.isArray(usersData)) {
          setWorkspaceUsers(usersData);
        }
      } catch (innerErr) {
        console.warn('Workspace users endpoint not found, manual email input required:', innerErr);
      }
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchTeams();
      fetchWorkspaceUsers();
    }
  }, [workspaceId]);

  // 4. Handle creation of a new team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !workspaceId) return;

    const teamName = newTeamName.trim();
    const teamDesc = newTeamDesc.trim();

    setNewTeamName('');
    setNewTeamDesc('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/teams`, {
        workspace_id: workspaceId,
        name: teamName,
        description: teamDesc || undefined,
      });
      
      if (response.data) {
        await fetchTeams();
      }
    } catch (err: any) {
      console.error('Create team error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.detail;
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to create team.');
    }
  };

  // 5. Handle deletion of an existing team
  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/teams/${teamId}`);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch (err: any) {
      console.error('Delete team error:', err);
      const errMsg = err.response?.data?.detail;
      alert(typeof errMsg === 'string' ? errMsg : 'Failed to delete team.');
    }
  };

  // 6. Handle updating an existing team details
  const handleUpdateTeam = async (teamId: string) => {
    if (!editingName.trim()) return;

    try {
      await axios.put(`${API_BASE_URL}/api/teams/${teamId}`, {
        name: editingName.trim(),
        description: editingDesc.trim() || undefined,
      });
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, name: editingName.trim(), description: editingDesc.trim() } : t))
      );
      setEditingTeamId(null);
    } catch (err: any) {
      console.error('Update team error:', err);
      const errMsg = err.response?.data?.detail;
      alert(typeof errMsg === 'string' ? errMsg : 'Failed to update team.');
    }
  };

  // 7. Handle adding a member using Email
  const handleAddMember = async (teamId: string) => {
    if (!newMemberEmail.trim()) {
      alert('Please enter or select a valid user email.');
      return;
    }
    const emailInput = newMemberEmail.trim();

    try {
      setError(''); // Clear previous error messages
      const response = await axios.post(`${API_BASE_URL}/api/teams/${teamId}/members`, {
        email: emailInput,
        role: newMemberRole,
      });

      // Check if backend returned a logical duplicate / custom warning response
      if (response.data && response.data.success === false) {
        const message = response.data.message || 'This user is already a member of the team.';
        setError(message);
        setNewMemberEmail(''); // Clear the email box so user can type a new one or close
        return; // Keep the managing section open so the error message is visible
      } 
      
      // Successful addition flow
      await fetchTeams();
      setNewMemberEmail('');
      setManagingTeamId(null); // Close the box only on true success
    } catch (err: any) {
      console.error('Add member error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message;
      const finalErrorMsg = typeof errMsg === 'string' ? errMsg : 'This user is already a member of the team.';
      
      setError(finalErrorMsg); // Display error clearly in top banner
      setNewMemberEmail(''); // Clear email input field for user convenience
      // Do not close managingTeamId here so user can see the error banner clearly
    }
  };
    
  // 8. Handle removing a member from a team
  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/teams/${teamId}/members/${userId}`);
      await fetchTeams();
    } catch (err: any) {
      console.error('Remove member error:', err);
      const errMsg = err.response?.data?.detail;
      alert(typeof errMsg === 'string' ? errMsg : 'Failed to remove team member.');
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Header
            eyebrow="Workspace"
            title="Team Management"
            description="Create collaborative teams, assign roles, and manage members."
          />

          <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Team name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <input
              type="text"
              placeholder="Description (optional)..."
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={!newTeamName.trim() || !workspaceId}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Team
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
            <Users className="h-8 w-8 text-[var(--muted-light)] mb-2" />
            <p>No teams found in this workspace. Create one above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-start">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Users className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTeamId(team.id);
                          setEditingName(team.name);
                          setEditingDesc(team.description || '');
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Team"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {editingTeamId === team.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="Team name"
                      />
                      <input
                        type="text"
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="Description"
                      />
                      <button
                        onClick={() => handleUpdateTeam(team.id)}
                        className="px-2.5 py-1 text-xs bg-[var(--primary)] text-white rounded-lg self-end cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{team.name}</h3>
                      <p className="text-xs text-[var(--muted)] mt-1">{team.description || 'No description provided.'}</p>
                    </div>
                  )}

                  {/* Members Section */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        Members ({team.team_members?.length || 0})
                      </span>
                      <button
                        onClick={() => {
                          setManagingTeamId(managingTeamId === team.id ? null : team.id);
                          setError(''); // Clear error when toggling view
                        }}
                        className="text-[11px] text-[var(--primary)] hover:underline font-medium cursor-pointer"
                      >
                        {managingTeamId === team.id ? 'Close' : '+ Add Member'}
                      </button>
                    </div>

                    {managingTeamId === team.id && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2.5 text-xs">
                        {workspaceUsers.length > 0 ? (
                          <select
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                          >
                            <option value="">Select a user email...</option>
                            {workspaceUsers.map((u) => (
                              <option key={u.id} value={u.email}>
                                {u.email} {u.name ? `(${u.name})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <input
                              type="email"
                              placeholder="Enter user email (e.g. user@example.com)"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Note: Enter the registered email of the user.</p>
                          </div>
                        )}

                        <div className="flex gap-2 items-center">
                          <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleAddMember(team.id)}
                            className="px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg whitespace-nowrap hover:opacity-90 transition cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="max-h-28 overflow-y-auto space-y-1.5">
                      {team.team_members && team.team_members.length > 0 ? (
                        team.team_members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded-lg border">
                            <span className="truncate max-w-[120px] text-gray-700" title={member.user_id}>
                              ID: {member.user_id.slice(0, 8)}...
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-medium capitalize">
                                {member.role}
                              </span>
                              <button
                                onClick={() => handleRemoveMember(team.id, member.user_id)}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                title="Remove member"
                              >
                                <UserMinus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-[var(--muted-light)] italic">No members added yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] text-[10px] text-[var(--muted-light)] flex justify-between">
                  <span>Team ID: {team.id.slice(0, 8)}...</span>
                  <span>Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}