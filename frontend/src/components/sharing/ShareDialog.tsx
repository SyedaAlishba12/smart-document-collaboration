"use client";

/**
 * ShareDialog — modal for sharing a document with people and managing access.
 *
 * Composes: Modal, AccessRow, LinkSharingToggle, SearchInput, Select, Button.
 *
 * All data is hardcoded mock data with TODO comments pointing to the real
 * API endpoints.  Wire up once POST /api/documents/{id}/share and
 * GET /api/documents/{id}/permissions are live.
 */

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/shared/SearchInput";
import Toast from "@/components/ui/Toast";
import AccessRow, { AccessEntry } from "./AccessRow";
import LinkSharingToggle from "./LinkSharingToggle";
import { PermissionLevel } from "@/components/shared/PermissionBadge";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  /** Document being shared — name shown in modal title. */
  documentName: string;
  /** TODO: replace with real document ID once API is wired. */
  documentId: string;
}

// ---------------------------------------------------------------------------
// Mock data — replace with API calls
// ---------------------------------------------------------------------------

const MOCK_ACCESS_LIST: AccessEntry[] = [
  {
    id: "1",
    name: "Alishba Syeda",
    email: "alishba@studiodocs.io",
    permissionLevel: "Owner",
    isOwner: true,
  },
  {
    id: "2",
    name: "Sayeel Ahmed",
    email: "sayeel@studiodocs.io",
    permissionLevel: "Editor",
  },
  {
    id: "3",
    name: "Hamza Rauf",
    email: "hamza@studiodocs.io",
    permissionLevel: "Viewer",
  },
];

export default function ShareDialog({
  open,
  onClose,
  documentName,
  documentId,
}: ShareDialogProps) {
  const [accessList, setAccessList] = useState<AccessEntry[]>(MOCK_ACCESS_LIST);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLevel, setInviteLevel] = useState<PermissionLevel>("Viewer");
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkLevel, setLinkLevel] = useState<"Editor" | "Commenter" | "Viewer">("Viewer");
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  // TODO: replace with POST /api/documents/{documentId}/share
  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newEntry: AccessEntry = {
      id: Date.now().toString(),
      name: inviteEmail,
      email: inviteEmail,
      permissionLevel: inviteLevel,
    };
    setAccessList((prev) => [...prev, newEntry]);
    setInviteEmail("");
    setToast({ show: true, message: `Invite sent to ${inviteEmail}` });
  };

  // TODO: replace with PUT /api/documents/{documentId}/permissions/{permissionId}
  const handleChangeLevel = (entryId: string, newLevel: PermissionLevel) => {
    setAccessList((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, permissionLevel: newLevel } : e))
    );
  };

  // TODO: replace with DELETE /api/documents/{documentId}/permissions/{permissionId}
  const handleRemove = (entryId: string) => {
    setAccessList((prev) => prev.filter((e) => e.id !== entryId));
  };

  // TODO: replace with POST /api/documents/{documentId}/link_sharing
  const handleToggleLink = (enabled: boolean) => setLinkEnabled(enabled);
  const handleChangeLinkLevel = (level: "Editor" | "Commenter" | "Viewer") =>
    setLinkLevel(level);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Share "${documentName}"`}
        size="lg"
      >
        {/* Invite row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onClear={() => setInviteEmail("")}
              placeholder="Add people by email..."
              aria-label="Invite people by email"
            />
          </div>
          <div className="w-36 shrink-0">
            <Select
              id="invite-level"
              value={inviteLevel}
              onChange={(e) => setInviteLevel(e.target.value as PermissionLevel)}
              options={[
                { label: "Viewer", value: "Viewer" },
                { label: "Commenter", value: "Commenter" },
                { label: "Editor", value: "Editor" },
              ]}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            className="shrink-0"
          >
            Invite
          </Button>
        </div>

        {/* People with access */}
        <div className="mt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            People with access
          </p>
          <div className="divide-y divide-[var(--border)]">
            {accessList.map((entry) => (
              <AccessRow
                key={entry.id}
                entry={entry}
                onChangeLevel={handleChangeLevel}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>

        {/* Link sharing */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            General access
          </p>
          <LinkSharingToggle
            enabled={linkEnabled}
            linkPermissionLevel={linkLevel}
            onToggle={handleToggleLink}
            onChangeLinkLevel={handleChangeLinkLevel}
            shareableLink={
              linkEnabled
                ? `https://studiodocs.io/d/${documentId}?share=link`
                : undefined
            }
          />
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>

      <Toast
        show={toast.show}
        message={toast.message}
        variant="success"
        onClose={() => setToast({ show: false, message: "" })}
      />
    </>
  );
}
