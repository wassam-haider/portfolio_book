"use client";

import { useEffect, useState } from "react";

interface FeedbackEntry {
  id: string;
  experienceAnswer: string;
  suggestionAnswer: string;
  createdAt: string;
}

export default function AdminFeedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (!res.ok) throw new Error("Failed to load feedback");
      const data = await res.json();
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this entry permanently?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Visitor Feedback</h1>
        <p className="text-sm text-slate-500">{entries.length} entries</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {new Date(e.createdAt).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => remove(e.id)}
                disabled={busyId === e.id}
                className="text-xs text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            {e.experienceAnswer && (
              <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  How do you find the experience?
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
                  {e.experienceAnswer}
                </p>
              </div>
            )}
            {e.suggestionAnswer && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Suggest something to add to a project
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
                  {e.suggestionAnswer}
                </p>
              </div>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-slate-500">
            No feedback yet.
          </p>
        )}
      </div>
    </div>
  );
}
