"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        if (!ignore) setProjects(data.projects);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load projects");
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(project: Project) {
    if (!confirm(`Delete "${project.title}" permanently? This cannot be undone.`)) return;
    setBusyId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= projects.length) return;
    const a = projects[index];
    const b = projects[other];
    // swap display orders (fall back to index-based orders when equal)
    const orderA = a.displayOrder === b.displayOrder ? other : b.displayOrder;
    const orderB = a.displayOrder === b.displayOrder ? index : a.displayOrder;
    await patch(a.id, { displayOrder: orderA });
    await patch(b.id, { displayOrder: orderB });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New project
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || busyId !== null}
                      className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === projects.length - 1 || busyId !== null}
                      className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-medium">{p.title}</td>
                <td className="px-4 py-2.5 text-slate-500">{p.category}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : p.status === "ONGOING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {p.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => patch(p.id, { published: !p.published })}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.published ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="mr-2 text-sm text-slate-600 underline-offset-2 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={busyId === p.id}
                    className="text-sm text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No projects yet. Create the first chronicle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
