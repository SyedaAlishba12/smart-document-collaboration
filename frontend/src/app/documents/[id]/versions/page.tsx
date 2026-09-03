"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import VersionDiffViewer from "@/components/versions/VersionDiffViewer";
import { useParams } from "next/navigation";
import api from "@/lib/api_client";

export default function VersionsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [versions, setVersions] = useState<any[]>([]);
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<{
    oldContent: string;
    newContent: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  async function fetchVersions() {
    try {
      const response = await api.get(
        `/api/documents/${documentId}/versions`
      );

      setVersions(response.data);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId: string) {
    try {
      await api.post(
        `/api/documents/${documentId}/versions/${versionId}/restore`
      );

      alert("Version restored successfully");

      await fetchVersions();
    } catch (err: any) {
      console.error("Failed to restore version:", err);
      alert(err.message || "Failed to restore version");
    }
  }

  async function handleView(versionId: string) {
    setViewingVersion(versionId);

    try {
      const response = await api.get(
        `/api/documents/${documentId}/versions/${versionId}`
      );

      const version = response.data;

      /*
       * We no longer request:
       *
       * /versions/latest
       *
       * because that route does not exist in the backend.
       *
       * The versions list is already sorted by version_number
       * in descending order, so versions[0] is the newest version.
       */

      const selectedIndex = versions.findIndex(
        (item) => item.id === versionId
      );

      /*
       * If the selected version is not the newest version,
       * compare it with the next newer version.
       *
       * If it is already the newest version, compare it
       * with itself so the viewer still has valid content.
       */

      const newerVersion =
        selectedIndex > 0 ? versions[selectedIndex - 1] : null;

      setDiffData({
        oldContent: version.content || "Empty",
        newContent:
          newerVersion?.content ||
          version.content ||
          "Empty",
      });
    } catch (err) {
      console.error("Failed to load version:", err);

      setDiffData({
        oldContent: "Unable to load",
        newContent: "Unable to load",
      });
    }
  }

  if (loading) {
    return <p>Loading versions...</p>;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-2xl font-semibold">
          Version History
        </h1>

        <div className="h-[600px] rounded-2xl border border-[var(--border)] bg-white">
          {viewingVersion ? (
            <VersionDiffViewer
              oldContent={diffData?.oldContent}
              newContent={diffData?.newContent}
              onClose={() => {
                setViewingVersion(null);
                setDiffData(null);
              }}
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

