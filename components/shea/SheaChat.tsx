"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SHEA_GREETING, SUGGESTED_QUESTIONS } from "@/lib/rag/persona";
import SheaMascot, { type SheaState } from "./SheaMascot";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: { type: "open"; slug: string; title: string } | null;
  error?: boolean;
}

const STORAGE_KEY = "shea-conversation";
const SESSION_KEY = "shea-session-id";

function newSessionId() {
  return `visit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function SheaChat({
  onOpenProject,
  compact,
}: {
  onOpenProject: (slug: string) => void;
  /** compact = mobile floating widget */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>("");

  // restore session conversation
  useEffect(() => {
    try {
      sessionRef.current = sessionStorage.getItem(SESSION_KEY) ?? newSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionRef.current);
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      sessionRef.current = newSessionId();
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage unavailable — conversation stays in memory */
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;
      setInput("");
      setMessages((m) => [...m, { role: "user", content: message }]);
      setBusy(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionRef.current, message }),
        });
        const data = (await res.json()) as {
          reply?: string;
          action?: ChatMessage["action"];
          error?: string;
        };
        if (!res.ok || !data.reply) {
          throw new Error(data.error ?? "The archives fell silent.");
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply!, action: data.action ?? null },
        ]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              err instanceof Error && err.message !== "Failed to fetch"
                ? err.message
                : "A draft blew out the candles — I could not reach the archives. Try once more, traveler.",
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const clearConversation = () => {
    setMessages([]);
    sessionRef.current = newSessionId();
    try {
      sessionStorage.setItem(SESSION_KEY, sessionRef.current);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const sheaState: SheaState = busy ? "thinking" : open ? "talking" : "idle";
  const showSuggestions = messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {/* mascot anchor */}
      <div className={compact ? "fixed bottom-20 right-3 z-40" : "relative z-30"}>
        <SheaMascot
          state={sheaState}
          size={compact ? 84 : 150}
          onClick={() => setOpen((o) => !o)}
        />
        {!open && !compact && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="font-fell pointer-events-none mt-1 text-center text-xs italic text-[var(--parchment)] opacity-80"
          >
            S.H.E.A., keeper of the archives
          </motion.p>
        )}
      </div>

      {/* chat panel */}
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
                : "fixed bottom-6 right-6 h-[min(72vh,640px)] w-[min(92vw,410px)]"
            }`}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-[rgba(180,154,98,0.3)] bg-black/30 px-4 py-2.5">
              <div>
                <p className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--gold-bright)]">
                  S.H.E.A.
                </p>
                <p className="font-fell text-[11px] italic text-[var(--parchment)] opacity-80">
                  Smart Helpful Electronic Assistant
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearConversation}
                  title="Clear conversation"
                  className="rounded border border-[rgba(180,154,98,0.4)] px-2 py-1 text-[11px] text-[var(--parchment)] hover:border-[var(--gold-bright)] hover:text-[var(--gold-bright)]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded border border-[rgba(180,154,98,0.4)] px-2 py-1 text-[11px] text-[var(--parchment)] hover:border-[var(--gold-bright)] hover:text-[var(--gold-bright)]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="page-scroll flex-1 space-y-3 px-3 py-3">
              <Bubble role="assistant" content={SHEA_GREETING} />
              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  error={m.error}
                  action={m.action ?? undefined}
                  onOpenProject={(slug) => {
                    setOpen(false);
                    onOpenProject(slug);
                  }}
                />
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--gold)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--gold)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--gold)]" />
                  <span className="font-fell ml-1 text-xs italic text-[var(--parchment)] opacity-80">
                    consulting the archives…
                  </span>
                </div>
              )}
            </div>

            {/* suggested questions */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-1.5 border-t border-[rgba(180,154,98,0.2)] px-3 py-2">
                {SUGGESTED_QUESTIONS.slice(0, compact ? 4 : 7).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-[rgba(180,154,98,0.45)] bg-black/20 px-2.5 py-1 font-book text-xs text-[var(--parchment)] transition hover:border-[var(--gold-bright)] hover:text-[var(--gold-bright)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-[rgba(180,154,98,0.3)] bg-black/30 px-3 py-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the keeper…"
                maxLength={2000}
                className="min-w-0 flex-1 rounded border border-[rgba(180,154,98,0.35)] bg-[rgba(230,213,181,0.08)] px-3 py-2 font-book text-sm text-[var(--aged-paper)] placeholder:text-[rgba(216,194,155,0.5)] focus:border-[var(--gold-bright)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-wax rounded px-3.5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({
  role,
  content,
  error,
  action,
  onOpenProject,
}: {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  action?: { type: "open"; slug: string; title: string } | null;
  onOpenProject?: (slug: string) => void;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded px-3 py-2 font-book text-sm leading-relaxed shadow ${
          role === "user"
            ? "bg-[rgba(180,154,98,0.22)] text-[var(--aged-paper)]"
            : error
              ? "border border-[rgba(180,90,70,0.5)] bg-[rgba(90,40,30,0.3)] text-[#e8c0b0]"
              : "texture-paper text-[var(--ink)]"
        }`}
      >
        <p className="whitespace-pre-line">{content}</p>
        {action && onOpenProject && (
          <button
            type="button"
            onClick={() => onOpenProject(action.slug)}
            className="btn-wax mt-2 block rounded px-3 py-1.5 text-[11px]"
          >
            📖 Open {action.title} in the book
          </button>
        )}
      </div>
    </div>
  );
}
