export type PermissionLevel =
  | "owner"
  | "editor"
  | "commenter"
  | "viewer";

const PERMISSION_RANK: Record<PermissionLevel, number> = {
  owner: 4,
  editor: 3,
  commenter: 2,
  viewer: 1,
};

export function hasPermission(
  userPermission: PermissionLevel,
  requiredPermission: PermissionLevel
): boolean {
  return (
    PERMISSION_RANK[userPermission] >= PERMISSION_RANK[requiredPermission]
  );
}

export function canEdit(permission: PermissionLevel): boolean {
  return hasPermission(permission, "editor");
}

export function canComment(permission: PermissionLevel): boolean {
  return hasPermission(permission, "commenter");
}

export function canView(permission: PermissionLevel): boolean {
  return hasPermission(permission, "viewer");
}

export function isOwner(permission: PermissionLevel): boolean {
  return permission === "owner";
}

export function canManagePermissions(
  permission: PermissionLevel
): boolean {
  return isOwner(permission);
}