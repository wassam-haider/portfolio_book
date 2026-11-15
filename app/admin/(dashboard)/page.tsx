"use client";

import { useCallback, useEffect, useState } from "react";

interface Stats {
  totalProjects: number;
  publishedProjects: number;
  ongoingProjects: number;
  completedProjects: number;
  totalConversations: number;
  topProjects: { title: string; views: number }[];
  recentQuestions: { content: string; at: string }[];
  knowledgeBase: {
    state: string;
    message: string;
    docCount: number;
    embeddingMode: string;
    lastIndexedAt: string | null;
  };
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [reindexing, setReindexing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        if (!ignore) setStats(data);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function reindex() {
    setReindexing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Re-indexing failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-indexing failed");
    } finally {
      setReindexing(false);
    }
  }

  if (error && !stats) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-slate-500">Loading…</p>;

  const cards = [
    { label: "Total projects", value: stats.totalProjects },
    { label: "Published", value: stats.publishedProjects },
    { label: "Ongoing", value: stats.ongoingProjects },
    { label: "Completed", value: stats.completedProjects },
    { label: "Visitor conversations", value: stats.totalConversations },
    { label: "Knowledge documents", value: stats.knowledgeBase.docCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">S.H.E.A. knowledge base</h2>
            <button
              type="button"
              onClick={reindex}
              disabled={reindexing}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {reindexing ? "Re-indexing…" : "Re-index now"}
            </button>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className={stats.knowledgeBase.state === "error" ? "text-red-600" : ""}>
                {stats.knowledgeBase.state} — {stats.knowledgeBase.message}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Retrieval mode</dt>
              <dd>
                {stats.knowledgeBase.embeddingMode === "semantic"
                  ? "Semantic (embeddings)"
                  : "Lexical fallback (configure EMBEDDING_PROVIDER for semantic search)"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Last indexed</dt>
              <dd>
                {stats.knowledgeBase.lastIndexedAt
                  ? new Date(stats.knowledgeBase.lastIndexedAt).toLocaleString()
                  : "never"}
              </dd>
            </div>
          </dl>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold">Most explored projects</h2>
          {stats.topProjects.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No visits tracked yet.</p>
          ) : (
            <ol className="mt-3 space-y-1.5 text-sm">
              {stats.topProjects.map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span>{p.title}</span>
                  <span className="text-slate-500">{p.views} views</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold">Recent visitor questions</h2>
        {stats.recentQuestions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No conversations yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {stats.recentQuestions.map((q, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span className="truncate">{q.content}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(q.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
