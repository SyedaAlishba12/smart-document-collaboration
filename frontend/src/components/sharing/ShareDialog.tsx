"use client";

/**
 * ShareDialog — modal for sharing a document with people and managing access.
 *
 * Composes: Modal, AccessRow, LinkSharingToggle, SearchInput, Select, Button.
 *
 * Data is fetched from the real API:
 *   GET  /api/documents/{id}/permissions
 *   POST /api/documents/{id}/share
 *   PUT  /api/documents/{id}/permissions/{permId}
 *   DELETE /api/documents/{id}/permissions/{permId}
 *   POST /api/documents/{id}/link_sharing
 */

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/shared/SearchInput";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import AccessRow, { AccessEntry } from "./AccessRow";
import LinkSharingToggle from "./LinkSharingToggle";
import { PermissionLevel } from "@/components/shared/PermissionBadge";
import {
  getPermissions,
  shareDocument,
  updatePermission,
  revokePermission,
  configureLinkSharing,
  PermissionEntry,
} from "@/lib/permissions_api";
import { searchUsers } from "@/lib/search_api";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  documentId: string;
}

// Map API level string → PermissionLevel used by UI components
function toUiLevel(level: string): PermissionLevel {
  const map: Record<string, PermissionLevel> = {
    owner: "Owner",
    editor: "Editor",
    commenter: "Commenter",
    viewer: "Viewer",
  };
  return map[level] ?? "Viewer";
}

function toApiLevel(level: PermissionLevel): string {
  return level.toLowerCase();
}

// Convert a PermissionEntry from the API into the AccessEntry shape the UI expects
function toAccessEntry(p: PermissionEntry): AccessEntry {
  return {
    id: p.id,
    name: p.user_name,
    email: p.user_email,
    avatarUrl: p.user_avatar_url ?? undefined,
    permissionLevel: toUiLevel(p.permission_level),
    isOwner: p.permission_level === "owner",
  };
}

export default function ShareDialog({
  open,
  onClose,
  documentName,
  documentId,
}: ShareDialogProps) {
  const [accessList, setAccessList] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLevel, setInviteLevel] = useState<PermissionLevel>("Viewer");
  const [inviting, setInviting] = useState(false);
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkLevel, setLinkLevel] = useState<"Editor" | "Commenter" | "Viewer">("Viewer");
  const [shareableLink, setShareableLink] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToast({ show: true, message, variant });
  };

  // ---------------------------------------------------------------------------
  // Fetch permission list on open
  // ---------------------------------------------------------------------------
  const fetchPermissions = useCallback(async () => {
    if (!open || !documentId) return;
    setLoading(true);
    try {
      const res = await getPermissions(documentId);
      if (res.success && res.data) {
        setAccessList(res.data.items.map(toAccessEntry));
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to load access list.", "error");
    } finally {
      setLoading(false);
    }
  }, [open, documentId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ---------------------------------------------------------------------------
  // Invite a user
  // ---------------------------------------------------------------------------
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // First resolve the user UUID via search by matching the email string
      const searchRes = await searchUsers({ query: inviteEmail.trim(), limit: 1 });
      const foundUser = searchRes.data?.items?.[0];

      if (!foundUser) {
        showToast("User not found.", "error");
        setInviting(false);
        return;
      }

      // Now grant them access
      const shareRes = await shareDocument(documentId, {
        user_id: foundUser.id,
        permission_level: toApiLevel(inviteLevel) as any,
        sharing_scope: "private"
      });

      if (shareRes.success) {
        showToast(`Invite sent to ${inviteEmail}`, "success");
        setInviteEmail("");
        await fetchPermissions(); // refresh the list
      } else {
        showToast(shareRes.message || "Failed to send invite.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to send invite.", "error");
    } finally {
      setInviting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Change a user's level
  // ---------------------------------------------------------------------------
  const handleChangeLevel = async (entryId: string, newLevel: PermissionLevel) => {
    try {
      const res = await updatePermission(documentId, entryId, {
        permission_level: toApiLevel(newLevel) as any,
      });
      if (res.success) {
        setAccessList((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, permissionLevel: newLevel } : e
          )
        );
        showToast("Permission updated.");
      }
    } catch {
      showToast("Failed to update permission.", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Remove access
  // ---------------------------------------------------------------------------
  const handleRemove = async (entryId: string) => {
    try {
      const res = await revokePermission(documentId, entryId);
      if (res.success) {
        setAccessList((prev) => prev.filter((e) => e.id !== entryId));
        showToast("Access removed.");
      }
    } catch {
      showToast("Failed to remove access.", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Link sharing
  // ---------------------------------------------------------------------------
  const handleToggleLink = async (enabled: boolean) => {
    try {
      const res = await configureLinkSharing(documentId, {
        enabled,
        link_permission_level: toApiLevel(linkLevel) as any,
      });
      if (res.success && res.data) {
        setLinkEnabled(res.data.enabled);
        setShareableLink(res.data.shareable_link ?? undefined);
        showToast(enabled ? "Link sharing enabled." : "Link sharing disabled.");
      }
    } catch {
      showToast("Failed to update link sharing.", "error");
    }
  };

  const handleChangeLinkLevel = async (level: "Editor" | "Commenter" | "Viewer") => {
    setLinkLevel(level);
    if (linkEnabled) {
      try {
        const res = await configureLinkSharing(documentId, {
          enabled: true,
          link_permission_level: toApiLevel(level) as any,
        });
        if (res.success && res.data) {
          setShareableLink(res.data.shareable_link ?? undefined);
        }
      } catch {
        showToast("Failed to update link level.", "error");
      }
    }
  };

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
            disabled={!inviteEmail.trim() || inviting}
            className="shrink-0"
          >
            {inviting ? "Inviting..." : "Invite"}
          </Button>
        </div>

        {/* People with access */}
        <div className="mt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            People with access
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {accessList.map((entry) => (
                <AccessRow
                  key={entry.id}
                  entry={entry}
                  onChangeLevel={handleChangeLevel}
                  onRemove={handleRemove}
                />
              ))}
              {accessList.length === 0 && (
                <p className="py-4 text-center text-sm text-[var(--muted)]">
                  No one has access yet. Invite someone above.
                </p>
              )}
            </div>
          )}
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
            shareableLink={shareableLink}
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
        variant={toast.variant === "error" ? "error" : "success"}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
