"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import VersionDiffViewer from "@/components/versions/VersionDiffViewer";
import { useParams } from "next/navigation";

export default function VersionsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [versions, setVersions] = useState([
    {
      id: "v1",
      versionNumber: 2,
      author: "Zainab Bibi",
      createdAt: "2h ago",
      isLatest: true,
    },
    {
      id: "v2",
      versionNumber: 1,
      author: "Syeda Alishba",
      createdAt: "5h ago",
      isLatest: false,
    },
  ]);

  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

  const handleRestore = (versionId: string) => {
    // Add API call here
    alert(`Restore version ${versionId}`);
  };

  const handleView = (versionId: string) => {
    setViewingVersion(versionId);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-[900px]">
        <h1 className="mb-6 text-2xl font-semibold">Version History</h1>
        <div className="h-[600px] rounded-2xl border border-[var(--border)] bg-white">
          {viewingVersion ? (
            <VersionDiffViewer
              oldContent="Old version content"
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