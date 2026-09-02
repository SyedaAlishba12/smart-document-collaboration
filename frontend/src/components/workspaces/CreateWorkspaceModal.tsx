"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { createWorkspace } from "@/lib/workspace_api";
import type { Workspace } from "@/types/workspace";

export default function CreateWorkspaceModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Workspace name is required."); return; }
    setLoading(true); setError(null);
    try {
      const workspace = await createWorkspace({ name: name.trim(), description: description.trim() || undefined });
      onCreated(workspace);
      localStorage.setItem("workspace_id", workspace.id);
      setName(""); setDescription(""); onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.detail ?? "Could not create workspace.");
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="workspace_name" label="Workspace name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing Team" maxLength={120} />
        <Input id="workspace_description" label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this workspace for?" maxLength={500} />
        {error && <Alert variant="error" message={error} />}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create workspace"}</Button>
        </div>
      </form>
    </Modal>
  );
}
