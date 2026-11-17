"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const QUESTIONS = [
  { key: "experienceAnswer" as const, label: "How do you find the experience?" },
  { key: "suggestionAnswer" as const, label: "Suggest something to add to a project." },
];

type Status = "idle" | "sending" | "sent" | "error";

export default function FeedbackScroll({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({ experienceAnswer: "", suggestionAnswer: "" });
  const [status, setStatus] = useState<Status>("idle");

  const close = () => {
    setOpen(false);
    // give the close animation a beat before resetting a just-submitted form
    window.setTimeout(() => {
      if (status === "sent") {
        setAnswers({ experienceAnswer: "", suggestionAnswer: "" });
        setStatus("idle");
      }
    }, 300);
  };

  const submit = async () => {
    if (!answers.experienceAnswer.trim() && !answers.suggestionAnswer.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Leave a note in the margins"
        className={
          compact
            ? "fixed bottom-20 left-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(180,154,98,0.4)] bg-[var(--walnut-deep)] text-xl shadow-[0_10px_28px_rgba(0,0,0,0.6)]"
            : "fixed bottom-5 left-7 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(180,154,98,0.4)] bg-[var(--walnut-deep)] text-2xl shadow-[0_10px_28px_rgba(0,0,0,0.6)] transition hover:border-[var(--gold-bright)]"
        }
      >
        🪶
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={`texture-leather z-50 flex flex-col overflow-hidden rounded-md border border-[rgba(180,154,98,0.4)] shadow-[0_24px_70px_rgba(0,0,0,0.8)] ${
              compact
                ? "fixed inset-x-2 bottom-2 top-16"
                : "fixed bottom-6 left-6 h-[min(72vh,560px)] w-[min(92vw,410px)]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[rgba(180,154,98,0.3)] bg-black/30 px-4 py-2.5">
              <div>
                <p className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--gold-bright)]">
                  A Blank Scroll
                </p>
                <p className="font-fell text-[11px] italic text-[var(--parchment)] opacity-80">
                  Leave a note in the margins
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Roll up the scroll"
                className="rounded border border-[rgba(180,154,98,0.4)] px-2 py-1 text-[11px] text-[var(--parchment)] hover:border-[var(--gold-bright)] hover:text-[var(--gold-bright)]"
              >
                ✕
              </button>
            </div>

            <div className="page-scroll flex-1 px-4 py-4">
              {status === "sent" ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-display text-base text-[var(--gold-bright)]">Ink has dried.</p>
                  <p className="font-fell mt-2 text-sm italic text-[var(--parchment)] opacity-85">
                    Your words have been added to the margins. Thank you, traveler.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {QUESTIONS.map((q) => (
                    <div key={q.key}>
                      <label className="font-book block text-sm text-[var(--parchment)]">
                        {q.label}
                      </label>
                      <textarea
                        value={answers[q.key]}
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, [q.key]: e.target.value.slice(0, 2000) }))
                        }
                        rows={3}
                        placeholder="Write here…"
                        className="mt-1.5 w-full resize-none rounded border border-[rgba(180,154,98,0.35)] bg-[rgba(230,213,181,0.08)] px-3 py-2 font-book text-sm text-[var(--aged-paper)] placeholder:text-[rgba(216,194,155,0.5)] focus:border-[var(--gold-bright)] focus:outline-none"
                      />
                    </div>
                  ))}
                  {status === "error" && (
                    <p className="font-fell text-xs italic text-[#e8a090]">
                      The quill slipped — try again.
                    </p>
                  )}
                </div>
              )}
            </div>

            {status !== "sent" && (
              <div className="flex items-center justify-end border-t border-[rgba(180,154,98,0.3)] bg-black/30 px-4 py-2.5">
                <button
                  type="button"
                  onClick={submit}
                  disabled={
                    status === "sending" ||
                    (!answers.experienceAnswer.trim() && !answers.suggestionAnswer.trim())
                  }
                  className="btn-wax rounded px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status === "sending" ? "Sealing…" : "Seal & Send"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
