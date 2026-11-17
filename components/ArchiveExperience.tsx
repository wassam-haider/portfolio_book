"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Project, Profile } from "@/lib/types";
import LibraryScene from "./book/LibraryScene";
import SheaChat from "./shea/SheaChat";
import FeedbackScroll from "./FeedbackScroll";

const FlipBook = dynamic(() => import("./book/FlipBook"), { ssr: false });
const MobileReader = dynamic(() => import("./book/MobileReader"), { ssr: false });

type Stage = "cover" | "opening" | "open";

const BOOK_TITLE = "THE ARCHIVES\nOF WASAM HAIDER";
const BOOK_SUBTITLE = "A CHRONICLE OF CODE, CREATION & DISCOVERY";

export default function ArchiveExperience({
  projects,
  profile,
}: {
  projects: Project[];
  profile: Profile | null;
}) {
  const [stage, setStage] = useState<Stage>("cover");
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const jumpRef = useRef<((slug: string) => void) | null>(null);
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const openBook = useCallback(() => {
    setStage((s) => (s === "cover" ? "opening" : s));
    window.setTimeout(() => setStage("open"), 1050);
  }, []);

  const closeBook = useCallback(() => {
    setStage("cover");
  }, []);

  const onProjectViewed = useCallback((projectId: string) => {
    if (lastTrackedRef.current === projectId) return;
    lastTrackedRef.current = projectId;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch(() => {});
  }, []);

  const jumpToSlug = useCallback(
    (slug: string) => {
      if (stage !== "open") {
        openBook();
        window.setTimeout(() => jumpRef.current?.(slug), 1200);
      } else {
        jumpRef.current?.(slug);
      }
    },
    [stage, openBook],
  );

  return (
    <div className="relative h-dvh overflow-hidden bg-[var(--walnut-deep)]">
      {/* The Forgotten Archives — persistent 3D library & hero grimoire.
          Mounted once; it never unmounts across stage changes so the WebGL
          context (and its procedurally-generated textures) is built only once. */}
      <LibraryScene
        title={BOOK_TITLE}
        subtitle={BOOK_SUBTITLE}
        bookOpen={stage !== "cover"}
        readerOpen={stage === "open"}
        onBookClick={openBook}
      />

      {/* overall vignette, matches the candlelit study mood */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 45%, transparent 55%, rgba(14,8,5,0.55) 100%)",
        }}
      />

      <AnimatePresence mode="wait">
        {stage !== "open" ? (
          <motion.div
            key="cover-hint"
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end px-4 pb-10 sm:pb-14"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
              className="pointer-events-auto flex flex-col items-center gap-4 text-center"
            >
              <p className="font-fell text-sm italic text-[var(--parchment)] opacity-90 sm:text-base">
                Within these pages lie the works of Wasam Haider.
              </p>
              <button
                type="button"
                onClick={openBook}
                disabled={stage === "opening"}
                className="btn-wax rounded px-6 py-2.5 text-xs sm:text-sm"
              >
                {stage === "opening" ? "Unsealing…" : "Open the Archives"}
              </button>
              <p className="font-fell text-[11px] uppercase tracking-[0.3em] text-[var(--gold)] opacity-70">
                or click the grimoire on the desk
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="relative z-10 h-full"
            key="book"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {isMobile ? (
              <MobileReader
                projects={projects}
                profile={profile}
                onProjectViewed={onProjectViewed}
                jumpRef={jumpRef}
                onClose={closeBook}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 py-6">
                <FlipBook
                  projects={projects}
                  profile={profile}
                  onProjectViewed={onProjectViewed}
                  jumpRef={jumpRef}
                  onClose={closeBook}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* S.H.E.A. — beside the book on desktop, floating widget on mobile */}
      {isMobile !== null && (
        <div className={isMobile ? "" : "fixed bottom-5 right-7 z-30"}>
          <SheaChat compact={isMobile} onOpenProject={jumpToSlug} />
        </div>
      )}

      {/* A blank scroll — visitors can leave a note, opposite S.H.E.A. */}
      {isMobile !== null && <FeedbackScroll compact={isMobile} />}
    </div>
  );
}
