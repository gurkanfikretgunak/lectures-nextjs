"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface CommitHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoOwner: string;
  repoName: string;
}

export function CommitHistoryModal({
  open,
  onOpenChange,
  repoOwner,
  repoName,
}: CommitHistoryModalProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=20`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }
      const data = await response.json();
      setCommits(
        data.map((commit: {
          sha: string;
          commit: { message: string; author: { name: string; date: string } };
          html_url: string;
        }) => ({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message.split("\n")[0],
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date).toLocaleDateString(),
          url: commit.html_url,
        }))
      );
    } catch (err) {
      setError("Failed to load commit history");
      console.error("Error fetching commits:", err);
    } finally {
      setLoading(false);
    }
  }, [repoOwner, repoName]);

  useEffect(() => {
    if (open && commits.length === 0) {
      fetchCommits();
    }
  }, [open, commits.length, fetchCommits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Commit History</span>
            <span className="text-sm font-normal text-muted-foreground">
              {repoOwner}/{repoName}
            </span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading commits...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
          {!loading && !error && commits.length > 0 && (
            <div className="space-y-2">
              {commits.map((commit) => (
                <a
                  key={commit.sha}
                  href={commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-primary group-hover:bg-primary/10 transition-colors">
                      {commit.sha}
                    </code>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {commit.message}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
