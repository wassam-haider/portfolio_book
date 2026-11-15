"use client";

import { useEffect, useState } from "react";
import type { Profile, SkillGroup, SocialLink } from "@/lib/types";

const inputCls =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600";

interface FormState {
  introduction: string;
  education: string;
  skills: SkillGroup[];
  experience: string;
  achievements: string;
  interests: string;
  socialLinks: SocialLink[];
  contactInformation: string;
}

const EMPTY: FormState = {
  introduction: "",
  education: "",
  skills: [],
  experience: "",
  achievements: "",
  interests: "",
  socialLinks: [],
  contactInformation: "",
};

export default function AdminProfile() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((data: { profile: Profile | null }) => {
        if (data.profile) {
          setForm({
            introduction: data.profile.introduction,
            education: data.profile.education,
            skills: data.profile.skills,
            experience: data.profile.experience,
            achievements: data.profile.achievements,
            interests: data.profile.interests,
            socialLinks: data.profile.socialLinks,
            contactInformation: data.profile.contactInformation,
          });
        }
        setLoaded(true);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoaded(true);
      });
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        ...form,
        skills: form.skills
          .map((g) => ({ group: g.group.trim(), items: g.items.filter(Boolean) }))
          .filter((g) => g.group),
        socialLinks: form.socialLinks.filter((l) => l.label.trim() && l.url.trim()),
      };
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.issues?.[0]
            ? `${data.issues[0].path?.join(".")}: ${data.issues[0].message}`
            : (data.error ?? "Save failed"),
        );
      }
      setMessage("Saved. S.H.E.A.'s knowledge base has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">About Me</h1>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {message && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <label className={labelCls}>
            Personal introduction
            <textarea className={inputCls} rows={5} value={form.introduction} onChange={(e) => set("introduction", e.target.value)} />
          </label>
          <label className={labelCls}>
            Education
            <textarea className={inputCls} rows={3} value={form.education} onChange={(e) => set("education", e.target.value)} />
          </label>
          <label className={labelCls}>
            Experience
            <textarea className={inputCls} rows={4} value={form.experience} onChange={(e) => set("experience", e.target.value)} />
          </label>
          <label className={labelCls}>
            Achievements
            <textarea className={inputCls} rows={3} value={form.achievements} onChange={(e) => set("achievements", e.target.value)} />
          </label>
          <label className={labelCls}>
            Interests
            <textarea className={inputCls} rows={2} value={form.interests} onChange={(e) => set("interests", e.target.value)} />
          </label>
          <label className={labelCls}>
            Contact information
            <textarea className={inputCls} rows={2} value={form.contactInformation} onChange={(e) => set("contactInformation", e.target.value)} />
          </label>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Skill groups</h2>
              <button
                type="button"
                onClick={() => set("skills", [...form.skills, { group: "", items: [] }])}
                className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
              >
                + Add group
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {form.skills.map((g, i) => (
                <div key={i} className="rounded border border-slate-100 bg-slate-50 p-3">
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      placeholder="Group name (e.g. Languages)"
                      value={g.group}
                      onChange={(e) =>
                        set("skills", form.skills.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => set("skills", form.skills.filter((_, j) => j !== i))}
                      className="mt-1 text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className={inputCls}
                    placeholder="Items, comma-separated (e.g. TypeScript, Python)"
                    value={g.items.join(", ")}
                    onChange={(e) =>
                      set(
                        "skills",
                        form.skills.map((x, j) =>
                          j === i
                            ? { ...x, items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              {form.skills.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Social links</h2>
              <button
                type="button"
                onClick={() => set("socialLinks", [...form.socialLinks, { label: "", url: "" }])}
                className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
              >
                + Add link
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {form.socialLinks.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="Label (e.g. GitHub)"
                    value={l.label}
                    onChange={(e) =>
                      set("socialLinks", form.socialLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                  />
                  <input
                    className={inputCls}
                    placeholder="https://…"
                    type="url"
                    value={l.url}
                    onChange={(e) =>
                      set("socialLinks", form.socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => set("socialLinks", form.socialLinks.filter((_, j) => j !== i))}
                    className="mt-1 text-sm text-red-600 hover:underline"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.socialLinks.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
