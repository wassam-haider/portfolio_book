"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, Challenge } from "@/lib/types";
import { ProjectDetails, ProjectOverview } from "@/components/book/pages/content";

type FormState = {
  title: string;
  slug: string;
  category: string;
  status: "COMPLETED" | "ONGOING" | "EXPERIMENTAL";
  shortDescription: string;
  fullDescription: string;
  problemStatement: string;
  objectives: string;
  features: string;
  technologies: string;
  architecture: string;
  challenges: Challenge[];
  contribution: string;
  githubUrl: string;
  liveDemoUrl: string;
  screenshots: string[];
  demoVideo: string;
  documentation: string;
  published: boolean;
  displayOrder: number;
};

function toForm(p?: Project): FormState {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    category: p?.category ?? "General",
    status: p?.status ?? "COMPLETED",
    shortDescription: p?.shortDescription ?? "",
    fullDescription: p?.fullDescription ?? "",
    problemStatement: p?.problemStatement ?? "",
    objectives: (p?.objectives ?? []).join("\n"),
    features: (p?.features ?? []).join("\n"),
    technologies: (p?.technologies ?? []).join(", "),
    architecture: p?.architecture ?? "",
    challenges: p?.challenges ?? [],
    contribution: p?.contribution ?? "",
    githubUrl: p?.githubUrl ?? "",
    liveDemoUrl: p?.liveDemoUrl ?? "",
    screenshots: p?.screenshots ?? [],
    demoVideo: p?.demoVideo ?? "",
    documentation: p?.documentation ?? "",
    published: p?.published ?? false,
    displayOrder: p?.displayOrder ?? 0,
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function toPayload(f: FormState) {
  return {
    title: f.title,
    slug: f.slug,
    category: f.category,
    status: f.status,
    shortDescription: f.shortDescription,
    fullDescription: f.fullDescription,
    problemStatement: f.problemStatement,
    objectives: splitLines(f.objectives),
    features: splitLines(f.features),
    technologies: f.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    architecture: f.architecture,
    challenges: f.challenges.filter((c) => c.challenge.trim() || c.solution.trim()),
    contribution: f.contribution,
    githubUrl: f.githubUrl.trim(),
    liveDemoUrl: f.liveDemoUrl.trim(),
    screenshots: f.screenshots,
    demoVideo: f.demoVideo.trim(),
    documentation: f.documentation,
    published: f.published,
    displayOrder: f.displayOrder,
  };
}

/** Build a Project-shaped object so the book-page components can render a preview. */
function toPreviewProject(f: FormState): Project {
  const payload = toPayload(f);
  return {
    id: "preview",
    ...payload,
    githubUrl: payload.githubUrl || null,
    liveDemoUrl: payload.liveDemoUrl || null,
    demoVideo: payload.demoVideo || null,
    createdAt: "",
    updatedAt: "",
  };
}

const inputCls =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600";

export default function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(project));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function uploadFiles(files: FileList | null, kind: "image" | "video") {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (kind === "image") {
          setForm((f) => ({ ...f, screenshots: [...f.screenshots, data.url] }));
        } else {
          setForm((f) => ({ ...f, demoVideo: data.url }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        project ? `/api/admin/projects/${project.id}` : "/api/admin/projects",
        {
          method: project ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(form)),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.issues?.[0]
            ? `${data.issues[0].path?.join(".")}: ${data.issues[0].message}`
            : (data.error ?? "Save failed"),
        );
      }
      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{project ? `Edit: ${project.title}` : "New project"}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Preview in book
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* left column */}
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold">Overview (left page)</h2>
          <label className={labelCls}>
            Project name *
            <input
              className={inputCls}
              value={form.title}
              required
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </label>
          <label className={labelCls}>
            Slug * <span className="font-normal text-slate-400">(URL-safe id, e.g. astra)</span>
            <input
              className={inputCls}
              value={form.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Category *
              <input
                className={inputCls}
                value={form.category}
                required
                onChange={(e) => set("category", e.target.value)}
              />
            </label>
            <label className={labelCls}>
              Status
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value as FormState["status"])}
              >
                <option value="COMPLETED">Completed</option>
                <option value="ONGOING">Ongoing</option>
                <option value="EXPERIMENTAL">Experimental</option>
              </select>
            </label>
          </div>
          <label className={labelCls}>
            Short introduction
            <textarea
              className={inputCls}
              rows={3}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Problem statement
            <textarea
              className={inputCls}
              rows={3}
              value={form.problemStatement}
              onChange={(e) => set("problemStatement", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Objectives <span className="font-normal text-slate-400">(one per line)</span>
            <textarea
              className={inputCls}
              rows={4}
              value={form.objectives}
              onChange={(e) => set("objectives", e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Display order
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.displayOrder}
                onChange={(e) => set("displayOrder", Number(e.target.value) || 0)}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
                className="h-4 w-4"
              />
              Published (visible in the book)
            </label>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold">Technical details (right page)</h2>
          <label className={labelCls}>
            Full description
            <textarea
              className={inputCls}
              rows={5}
              value={form.fullDescription}
              onChange={(e) => set("fullDescription", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Technologies <span className="font-normal text-slate-400">(comma-separated)</span>
            <input
              className={inputCls}
              value={form.technologies}
              onChange={(e) => set("technologies", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Architecture &amp; implementation
            <textarea
              className={inputCls}
              rows={4}
              value={form.architecture}
              onChange={(e) => set("architecture", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Key features <span className="font-normal text-slate-400">(one per line)</span>
            <textarea
              className={inputCls}
              rows={4}
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            My contribution
            <textarea
              className={inputCls}
              rows={2}
              value={form.contribution}
              onChange={(e) => set("contribution", e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              GitHub URL
              <input
                type="url"
                className={inputCls}
                value={form.githubUrl}
                onChange={(e) => set("githubUrl", e.target.value)}
              />
            </label>
            <label className={labelCls}>
              Live demo URL
              <input
                type="url"
                className={inputCls}
                value={form.liveDemoUrl}
                onChange={(e) => set("liveDemoUrl", e.target.value)}
              />
            </label>
          </div>
          <label className={labelCls}>
            Additional documentation{" "}
            <span className="font-normal text-slate-400">(also fed to S.H.E.A.)</span>
            <textarea
              className={inputCls}
              rows={3}
              value={form.documentation}
              onChange={(e) => set("documentation", e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* challenges */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Challenges &amp; solutions</h2>
          <button
            type="button"
            onClick={() =>
              set("challenges", [...form.challenges, { challenge: "", solution: "" }])
            }
            className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
          >
            + Add
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {form.challenges.map((c, i) => (
            <div key={i} className="grid gap-2 rounded border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Challenge"
                value={c.challenge}
                onChange={(e) =>
                  set(
                    "challenges",
                    form.challenges.map((x, j) =>
                      j === i ? { ...x, challenge: e.target.value } : x,
                    ),
                  )
                }
              />
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Solution"
                value={c.solution}
                onChange={(e) =>
                  set(
                    "challenges",
                    form.challenges.map((x, j) =>
                      j === i ? { ...x, solution: e.target.value } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                onClick={() => set("challenges", form.challenges.filter((_, j) => j !== i))}
                className="self-center text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          {form.challenges.length === 0 && (
            <p className="text-sm text-slate-400">None yet.</p>
          )}
        </div>
      </div>

      {/* media */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold">Media</h2>
        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          <div>
            <label className={labelCls}>
              Screenshots{" "}
              <span className="font-normal text-slate-400">
                (JPEG/PNG/WebP/GIF, ≤8 MB each; first one becomes the left-page plate)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploading}
                onChange={(e) => uploadFiles(e.target.files, "image")}
                className="mt-1 block w-full text-sm"
              />
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {form.screenshots.map((url, i) => (
                <div key={url} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Screenshot ${i + 1}`} className="h-20 w-full rounded border border-slate-200 object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      set("screenshots", form.screenshots.filter((_, j) => j !== i))
                    }
                    className="absolute right-1 top-1 hidden rounded bg-black/70 px-1.5 text-xs text-white group-hover:block"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>
              Demo video URL{" "}
              <span className="font-normal text-slate-400">(YouTube/Vimeo link or uploaded file)</span>
              <input
                className={inputCls}
                value={form.demoVideo}
                placeholder="https://youtube.com/watch?v=…"
                onChange={(e) => set("demoVideo", e.target.value)}
              />
            </label>
            <label className={`${labelCls} mt-3`}>
              …or upload a video (MP4/WebM, ≤100 MB)
              <input
                type="file"
                accept="video/mp4,video/webm"
                disabled={uploading}
                onChange={(e) => uploadFiles(e.target.files, "video")}
                className="mt-1 block w-full text-sm"
              />
            </label>
            {uploading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
          </div>
        </div>
      </div>

      {/* preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="grid max-h-[90vh] w-full max-w-5xl grid-cols-1 gap-0 overflow-y-auto rounded shadow-2xl md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="page-paper page-edge-left p-6">
              <ProjectOverview project={toPreviewProject(form)} />
            </div>
            <div className="page-paper page-edge-right p-6">
              <ProjectDetails project={toPreviewProject(form)} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreview(false)}
            className="absolute right-4 top-4 rounded bg-white/90 px-3 py-1.5 text-sm font-medium"
          >
            Close ✕
          </button>
        </div>
      )}
    </form>
  );
}
