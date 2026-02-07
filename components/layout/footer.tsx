"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CommitHistoryModal } from "./commit-history-modal";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [commitHash, setCommitHash] = useState<string | null>(null);
  const [showCommitHistory, setShowCommitHistory] = useState(false);

  useEffect(() => {
    // Try to get commit hash from environment variable or fetch from API
    const hash = process.env.NEXT_PUBLIC_COMMIT_HASH;
    if (hash) {
      setCommitHash(hash);
    } else {
      // Fallback: try to get from git or API
      fetchCommitHash();
    }
  }, []);

  const fetchCommitHash = async () => {
    try {
      // Try GitHub API to get latest commit
      const response = await fetch(
        "https://api.github.com/repos/gurkanfikretgunak/lectures-nextjs/commits?per_page=1"
      );
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setCommitHash(data[0].sha.substring(0, 7));
        }
      }
    } catch (err) {
      console.error("Failed to fetch commit hash:", err);
    }
  };

  return (
    <>
      <footer className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span>Source:</span>
              <Link
                href="https://github.com/gurkanfikretgunak/lectures-nextjs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline"
              >
                GitHub
              </Link>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">masterfabric</span>
              <span>•</span>
              <span>© {currentYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="https://masterfabric.co"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors font-medium underline"
              >
                masterfabric
              </Link>
              {commitHash && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => setShowCommitHistory(true)}
                    className="hover:text-foreground transition-colors font-mono text-xs underline cursor-pointer"
                    title="View commit history"
                  >
                    {commitHash}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
      <CommitHistoryModal
        open={showCommitHistory}
        onOpenChange={setShowCommitHistory}
        repoOwner="gurkanfikretgunak"
        repoName="lectures-nextjs"
      />
    </>
  );
}
