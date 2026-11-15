"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--walnut)] px-4 font-sans">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-[rgba(180,154,98,0.35)] bg-[#2a1b12] p-8 shadow-2xl"
      >
        <h1 className="font-display text-center text-lg font-bold tracking-[0.15em] text-[var(--gold-bright)]">
          KEEPER&apos;S ENTRANCE
        </h1>
        <p className="font-fell mt-1 text-center text-xs italic text-[var(--parchment)] opacity-80">
          Administration of the Archives
        </p>

        <label className="mt-6 block text-xs font-medium text-[var(--parchment)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="mt-1 w-full rounded border border-[rgba(180,154,98,0.35)] bg-black/30 px-3 py-2 text-sm text-[var(--aged-paper)] focus:border-[var(--gold-bright)] focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-xs font-medium text-[var(--parchment)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-[rgba(180,154,98,0.35)] bg-black/30 px-3 py-2 text-sm text-[var(--aged-paper)] focus:border-[var(--gold-bright)] focus:outline-none"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={busy} className="btn-wax mt-6 w-full rounded px-4 py-2.5 text-sm disabled:opacity-50">
          {busy ? "Unlocking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
