"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import VersionDiffViewer from "@/components/versions/VersionDiffViewer";
import { useParams } from "next/navigation";
import apiFetch from "@/lib/api";

export default function VersionsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [versions, setVersions] = useState<any[]>([]);
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  async function fetchVersions() {
    try {
      const data = await apiFetch<any[]>(`/api/documents/${documentId}/versions`);
      setVersions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId: string) {
    try {
      const updated = await apiFetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      alert("Version restored successfully");
      fetchVersions(); // refresh list
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleView(versionId: string) {
    // Optional: fetch specific version detail for diff
    setViewingVersion(versionId);
  }

  if (loading) return <p>Loading versions...</p>;

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-2xl font-semibold">Version History</h1>
        <div className="h-[600px] rounded-2xl border border-[var(--border)] bg-white">
          {viewingVersion ? (
            <VersionDiffViewer
              oldContent="Old version content" // You'll need to fetch actual version data
              newContent="New version content"
              onClose={() => setViewingVersion(null)}
            />
          ) : (
            <VersionHistoryPanel
              versions={versions}
              onRestore={handleRestore}
              onView={handleView}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}