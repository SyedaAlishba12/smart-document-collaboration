import Card from "@/components/ui/Card";
import type { Workspace } from "@/types/workspace";

export default function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <a href={`/workspaces/${workspace.id}`} className="block">
      <Card hover>
        <h3 className="font-semibold text-[var(--foreground)]">{workspace.name}</h3>
        {workspace.description && (
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {workspace.description}
          </p>
        )}
      </Card>
    </a>
  );
}
