"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project, Profile } from "@/lib/types";
import { AboutContent, ProjectDetails, ProjectOverview, StatusSeal } from "./pages/content";
import Emblem from "./Emblem";

/**
 * Dedicated mobile reading experience: one parchment page at a time with a
 * swipe/turn animation, a table-of-contents drawer, and page indicators.
 */

type MobilePage =
  | { kind: "title" }
  | { kind: "toc" }
  | { kind: "overview"; project: Project; index: number }
  | { kind: "details"; project: Project; index: number }
  | { kind: "about" };

interface MobileReaderProps {
  projects: Project[];
  profile: Profile | null;
  onProjectViewed: (projectId: string) => void;
  jumpRef: React.MutableRefObject<((slug: string) => void) | null>;
  /** Seals the tome and returns to the 3D cover. */
  onClose: () => void;
}

const SWIPE_THRESHOLD = 70;

const pageVariants = {
  enter: (d: number) => ({
    x: d >= 0 ? "70%" : "-70%",
    rotateY: d >= 0 ? -28 : 28,
    opacity: 0,
  }),
  center: { x: 0, rotateY: 0, opacity: 1 },
  exit: (d: number) => ({
    x: d >= 0 ? "-55%" : "55%",
    rotateY: d >= 0 ? 24 : -24,
    opacity: 0,
  }),
};

export default function MobileReader({
  projects,
  profile,
  onProjectViewed,
  jumpRef,
  onClose,
}: MobileReaderProps) {
  const pages = useMemo<MobilePage[]>(
    () => [
      { kind: "title" },
      { kind: "toc" },
      ...projects.flatMap<MobilePage>((project, index) => [
        { kind: "overview", project, index },
        { kind: "details", project, index },
      ]),
      { kind: "about" },
    ],
    [projects],
  );

  const [[pageIndex, direction], setPageState] = useState<[number, number]>([0, 0]);
  const [tocOpen, setTocOpen] = useState(false);

  const go = useCallback(
    (next: number, dir: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, next));
      setPageState([clamped, dir]);
      const p = pages[clamped];
      if (p.kind === "overview" || p.kind === "details") onProjectViewed(p.project.id);
    },
    [pages, onProjectViewed],
  );

  useEffect(() => {
    jumpRef.current = (slug: string) => {
      const idx = pages.findIndex((p) => p.kind === "overview" && p.project.slug === slug);
      if (idx >= 0) {
        setTocOpen(false);
        go(idx, 1);
      }
    };
    return () => {
      jumpRef.current = null;
    };
  }, [pages, go, jumpRef]);

  const page = pages[pageIndex];
  const label =
    page.kind === "overview" || page.kind === "details"
      ? page.project.title
      : page.kind === "about"
        ? "About the Maker"
        : page.kind === "toc"
          ? "Index"
          : "The Archives";

  return (
    <div className="flex min-h-dvh flex-col px-3 pb-24 pt-4">
      {/* top bar */}
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          aria-label="Open the index of chronicles"
          className="btn-wax shrink-0 rounded px-3 py-1.5 text-[11px]"
        >
          ☰
        </button>
        <p className="font-display min-w-0 flex-1 truncate text-center text-xs tracking-[0.12em] text-[var(--gold-bright)]">
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <p className="font-fell whitespace-nowrap text-[11px] italic text-[var(--parchment)] opacity-80">
            {pageIndex + 1}/{pages.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Seal the tome"
            className="btn-wax rounded px-3 py-1.5 text-[11px]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* the page */}
      <div className="relative flex-1" style={{ perspective: 1400 }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={pageIndex}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.3, 0.6, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD) go(pageIndex + 1, 1);
              else if (info.offset.x > SWIPE_THRESHOLD) go(pageIndex - 1, -1);
            }}
            className="page-paper absolute inset-0 overflow-hidden rounded-sm shadow-[0_14px_40px_rgba(0,0,0,0.7)]"
            style={{ transformOrigin: direction >= 0 ? "left center" : "right center" }}
          >
            <div className="page-scroll h-full px-5 py-5">
              <MobilePageBody page={page} profile={profile} totalProjects={projects.length} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-6 bg-gradient-to-t from-[rgba(14,8,5,0.95)] via-[rgba(14,8,5,0.8)] to-transparent px-4 pb-4 pt-6">
        <button
          type="button"
          onClick={() => go(pageIndex - 1, -1)}
          disabled={pageIndex === 0}
          className="btn-wax rounded px-5 py-2 text-xs disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => go(pageIndex + 1, 1)}
          disabled={pageIndex === pages.length - 1}
          className="btn-wax rounded px-5 py-2 text-xs disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      {/* TOC drawer */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTocOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="texture-paper fixed inset-y-0 left-0 z-50 w-[82%] max-w-sm overflow-y-auto p-5 shadow-2xl"
            >
              <h3 className="font-display small-caps text-base font-bold tracking-[0.15em] text-[var(--ink)]">
                Index of Chronicles
              </h3>
              <div className="ornament mt-2 text-xs">❦</div>
              <ol className="mt-4 space-y-3">
                {projects.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTocOpen(false);
                        go(2 + i * 2, 1);
                      }}
                      className="w-full text-left"
                    >
                      <span className="font-book text-[16px] font-semibold text-[var(--ink)]">
                        {String(i + 1).padStart(2, "0")} · {p.title}
                      </span>
                      <span className="mt-0.5 block">
                        <StatusSeal status={p.status} />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => {
                  setTocOpen(false);
                  go(pages.length - 1, 1);
                }}
                className="font-book mt-5 block border-t border-[rgba(118,81,57,0.3)] pt-3 text-[15px] font-semibold text-[var(--coffee-dark)]"
              >
                ❧ Concerning the Maker
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobilePageBody({
  page,
  profile,
  totalProjects,
}: {
  page: MobilePage;
  profile: Profile | null;
  totalProjects: number;
}) {
  switch (page.kind) {
    case "title":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Emblem size={110} className="opacity-85" />
          <h2 className="font-display mt-5 text-xl font-bold tracking-[0.12em] text-[var(--ink)]">
            THE ARCHIVES
          </h2>
          <p className="font-fell mt-2 text-sm italic text-[var(--coffee-dark)]">
            A Chronicle of Code, Creation &amp; Discovery
          </p>
          <div className="gold-rule mt-4 w-32" />
          <p className="font-book mt-5 text-[15px] italic leading-relaxed text-[var(--ink-soft)]">
            {totalProjects} chronicle{totalProjects === 1 ? "" : "s"} await within. Swipe to
            turn the pages.
          </p>
        </div>
      );
    case "toc":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h3 className="font-display small-caps text-lg font-bold tracking-[0.15em] text-[var(--ink)]">
            Index of Chronicles
          </h3>
          <div className="ornament mt-2 w-32 text-sm">❦</div>
          <p className="font-book mt-4 max-w-[30ch] text-[15px] italic leading-relaxed text-[var(--ink-soft)]">
            Use the ☰ Index above to leap to any chronicle, or simply keep turning the pages.
          </p>
        </div>
      );
    case "overview":
      return <ProjectOverview project={page.project} />;
    case "details":
      return (
        <>
          <p className="font-fell text-[11px] uppercase tracking-[0.25em] text-[var(--coffee)]">
            {page.project.title} — continued
          </p>
          <div className="mt-2">
            <ProjectDetails project={page.project} />
          </div>
        </>
      );
    case "about":
      return (
        <>
          <h3 className="font-display small-caps text-center text-lg font-bold tracking-[0.15em] text-[var(--ink)]">
            Concerning the Maker
          </h3>
          <div className="ornament mt-2 text-sm">❦</div>
          <div className="mt-3">
            {profile ? (
              <AboutContent profile={profile} />
            ) : (
              <p className="font-fell mt-8 text-center text-sm italic text-[var(--coffee-dark)]">
                This page of the archives is yet to be written.
              </p>
            )}
          </div>
        </>
      );
  }
}
