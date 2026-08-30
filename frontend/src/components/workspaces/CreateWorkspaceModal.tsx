"use client";

import { useState } from "react";
import api from "@/lib/api_client";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { Workspace } from "@/types/workspace";

export default function CreateWorkspaceModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/workspaces", { name, description });
      onCreated(res.data);
      setName("");
      setDescription("");
      onClose();
    } catch {
      setError("Could not create workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="workspace_name"
          label="Workspace name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Team"
        />
        <Input
          id="workspace_description"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this workspace for?"
        />

        {error && <Alert variant="error" message={error} />}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
