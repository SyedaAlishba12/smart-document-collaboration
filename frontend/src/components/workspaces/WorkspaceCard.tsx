import type { Workspace } from "@/types/workspace";

export default function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <a
      href={`/workspaces/${workspace.id}`}
      className="block rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
    >
      <h3 className="font-medium text-gray-900">{workspace.name}</h3>
      {workspace.description && (
        <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
      )}
    </a>
  );
}
