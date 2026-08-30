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
  const [diffData, setDiffData] = useState<{ oldContent: string; newContent: string } | null>(null);
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
      fetchVersions();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleView(versionId: string) {
    setViewingVersion(versionId);
    // Fetch the specific version content
    try {
      const version = await apiFetch<any>(`/api/documents/${documentId}/versions/${versionId}`);
      // Fetch the latest version to compare with
      const latestVersion = await apiFetch<any>(`/api/documents/${documentId}/versions/latest`);
      setDiffData({
        oldContent: version.content || "Empty",
        newContent: latestVersion.content || "Empty",
      });
    } catch (err) {
      setDiffData({ oldContent: "Unable to load", newContent: "Unable to load" });
    }
  }

  if (loading) return <p>Loading versions...</p>;

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-2xl font-semibold">Version History</h1>
        <div className="h-[600px] rounded-2xl border border-[var(--border)] bg-white">
          {viewingVersion ? (
            <VersionDiffViewer
              oldContent={diffData?.oldContent}
              newContent={diffData?.newContent}
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