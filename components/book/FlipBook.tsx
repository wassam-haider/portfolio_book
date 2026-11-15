"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import type { Project, Profile } from "@/lib/types";
import PageShell from "./pages/PageShell";
import { AboutContent, ProjectDetails, ProjectOverview, StatusSeal } from "./pages/content";
import Emblem from "./Emblem";

// react-pageflip's IProps marks every setting as required; relax it once here.
const FlipBookComponent = HTMLFlipBook as unknown as React.ComponentType<
  Record<string, unknown> & { children?: React.ReactNode }
>;

/** Imperative handle shape exposed by react-pageflip. */
interface PageFlipApi {
  pageFlip: () => {
    flip: (page: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
  };
}

interface FlipBookProps {
  projects: Project[];
  profile: Profile | null;
  onProjectViewed: (projectId: string) => void;
  /** Parent can set this ref to jump to a project slug (used by S.H.E.A.). */
  jumpRef: React.MutableRefObject<((slug: string) => void) | null>;
}

export default function FlipBook({ projects, profile, onProjectViewed, jumpRef }: FlipBookProps) {
  const bookRef = useRef<PageFlipApi | null>(null);
  const [page, setPage] = useState(0);

  // page math: 0 title, 1 TOC, projects at 2+2i / 3+2i, then About + colophon
  const aboutPageIndex = 2 + projects.length * 2;
  const totalPages = aboutPageIndex + 2;

  const projectForPage = useCallback(
    (p: number): Project | null => {
      const i = Math.floor((p - 2) / 2);
      return p >= 2 && i >= 0 && i < projects.length ? projects[i] : null;
    },
    [projects],
  );

  const jumpToProject = useCallback(
    (index: number) => {
      bookRef.current?.pageFlip()?.flip(2 + index * 2);
    },
    [],
  );

  useEffect(() => {
    jumpRef.current = (slug: string) => {
      const idx = projects.findIndex((p) => p.slug === slug);
      if (idx >= 0) jumpToProject(idx);
    };
    return () => {
      jumpRef.current = null;
    };
  }, [projects, jumpToProject, jumpRef]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable=true]")) return;
      if (e.key === "ArrowRight") bookRef.current?.pageFlip()?.flipNext();
      if (e.key === "ArrowLeft") bookRef.current?.pageFlip()?.flipPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      setPage(e.data);
      const project = projectForPage(e.data);
      if (project) onProjectViewed(project.id);
    },
    [projectForPage, onProjectViewed],
  );

  const currentProject = projectForPage(page);
  const spreadLabel = currentProject
    ? currentProject.title
    : page >= aboutPageIndex
      ? "About the Maker"
      : "Index of Chronicles";

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="book-depth relative overflow-hidden"
        style={{
          // Explicit width AND height, not `aspectRatio`: aspect-ratio is only
          // a *preference* for an empty box — react-pageflip's own rendered
          // content can still force this box taller once it doesn't match,
          // which is exactly what outgrew short viewports and forced a page
          // scroll. Both formulas below independently pick from the same
          // three (width, height) pairs — (94vw, 94vw*0.66), (1160px,
          // 1160px*0.66), and the height-budget pair itself — so whichever
          // branch wins always keeps the 2:1.32 ratio and never exceeds the
          // viewport height budget.
          width: "min(94vw, 1160px, calc((100dvh - 144px) * 2 / 1.32))",
          height: "min(62.04vw, 765.6px, calc(100dvh - 144px))",
        }}
      >
        <FlipBookComponent
          ref={bookRef}
          width={550}
          height={726}
          size="stretch"
          // minWidth/minHeight are a hard floor react-pageflip will not
          // shrink below in "stretch" mode, even if that means overflowing
          // its container — which is exactly what happened on short
          // viewports once .book-depth's own (viewport-height-aware) size
          // dropped under the old 560/420 floor: the book rendered at its
          // minimum (1120x739) regardless, got clipped by overflow-hidden,
          // and the right page appeared cut off. Set low enough that
          // .book-depth's own sizing is always the real constraint.
          minWidth={240}
          maxWidth={1160}
          minHeight={317}
          maxHeight={840}
          showCover={false}
          usePortrait={false}
          flippingTime={850}
          maxShadowOpacity={0.45}
          mobileScrollSupport={false}
          onFlip={handleFlip}
          className="shadow-[0_26px_70px_rgba(0,0,0,0.75)]"
          style={{}}
        >
          {/* 0 — inner title page */}
          <PageShell side="left" className="coffee-stain">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Emblem size={120} className="opacity-80" />
              <h2 className="font-display mt-6 text-2xl font-bold tracking-[0.12em] text-[var(--ink)]">
                THE ARCHIVES
              </h2>
              <p className="font-fell mt-2 text-sm italic text-[var(--coffee-dark)]">
                A Chronicle of Code, Creation &amp; Discovery
              </p>
              <div className="gold-rule mt-5 w-36" />
              <p className="font-book mt-5 max-w-[34ch] text-[15px] italic leading-relaxed text-[var(--ink-soft)]">
                Herein are recorded the projects, experiments and research of Wasam Haider —
                each chronicle laid upon its own spread of pages.
              </p>
              <p className="font-fell mt-6 text-xs uppercase tracking-[0.3em] text-[var(--coffee)]">
                Turn the page to begin
              </p>
            </div>
          </PageShell>

          {/* 1 — table of contents */}
          <PageShell side="right" pageNumber={1}>
            <h3 className="font-display small-caps text-center text-lg font-bold tracking-[0.15em] text-[var(--ink)]">
              Index of Chronicles
            </h3>
            <div className="ornament mt-2 text-sm">❦</div>
            <div
              className="page-scroll mt-3 flex-1 pr-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {projects.length === 0 && (
                <p className="font-fell mt-8 text-center text-sm italic text-[var(--coffee-dark)]">
                  The archives await their first chronicle.
                </p>
              )}
              <ol className="space-y-2.5">
                {projects.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => jumpToProject(i)}
                      className="group flex w-full items-baseline gap-2 text-left"
                    >
                      <span className="font-display text-sm font-semibold text-[var(--coffee-dark)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-book text-[16px] font-semibold text-[var(--ink)] underline-offset-4 group-hover:underline">
                        {p.title}
                      </span>
                      <span className="mx-1 flex-1 border-b border-dotted border-[rgba(118,81,57,0.5)]" />
                      <StatusSeal status={p.status} />
                    </button>
                    <p className="font-book ml-7 text-[13px] italic leading-snug text-[var(--ink-soft)]">
                      {p.category}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-[rgba(118,81,57,0.3)] pt-3">
                <button
                  type="button"
                  onClick={() => bookRef.current?.pageFlip()?.flip(aboutPageIndex)}
                  className="font-book text-[15px] font-semibold text-[var(--coffee-dark)] underline-offset-4 hover:underline"
                >
                  ❧ Concerning the Maker — about the developer
                </button>
              </div>
            </div>
          </PageShell>

          {/* project spreads */}
          {projects.flatMap((project, i) => [
            <PageShell key={`${project.id}-l`} side="left" pageNumber={2 + i * 2}>
              <div
                className="page-scroll flex-1 pr-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ProjectOverview project={project} />
              </div>
            </PageShell>,
            <PageShell key={`${project.id}-r`} side="right" pageNumber={3 + i * 2}>
              <div
                className="page-scroll flex-1 pr-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ProjectDetails project={project} />
              </div>
            </PageShell>,
          ])}

          {/* about the maker */}
          <PageShell side="left" pageNumber={aboutPageIndex}>
            <h3 className="font-display small-caps text-center text-lg font-bold tracking-[0.15em] text-[var(--ink)]">
              Concerning the Maker
            </h3>
            <div className="ornament mt-2 text-sm">❦</div>
            <div
              className="page-scroll mt-3 flex-1 pr-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {profile ? (
                <AboutContent profile={profile} />
              ) : (
                <p className="font-fell mt-8 text-center text-sm italic text-[var(--coffee-dark)]">
                  This page of the archives is yet to be written.
                </p>
              )}
            </div>
          </PageShell>

          {/* colophon */}
          <PageShell side="right" className="coffee-stain">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="ornament w-40 text-sm">❦</div>
              <p className="font-fell mt-6 max-w-[30ch] text-[15px] italic leading-relaxed text-[var(--ink-soft)]">
                Thus ends the present record of the archives. New chronicles are inscribed as
                the maker&apos;s work continues.
              </p>
              <p className="font-book mt-6 text-sm text-[var(--coffee-dark)]">
                Should you seek anything within these pages, ask S.H.E.A. — the keeper never
                sleeps.
              </p>
              <Emblem size={90} className="mt-8 opacity-60" />
            </div>
          </PageShell>
        </FlipBookComponent>
      </div>

      {/* navigation chrome */}
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          className="btn-wax rounded px-4 py-2 text-xs"
          aria-label="Previous pages"
        >
          ← Prev
        </button>
        <div className="text-center">
          <p className="font-display text-xs tracking-[0.15em] text-[var(--gold-bright)]">
            {spreadLabel}
          </p>
          <p className="font-fell mt-0.5 text-[11px] italic text-[var(--parchment)] opacity-80">
            folio {Math.floor(page / 2) + 1} of {Math.ceil(totalPages / 2)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          className="btn-wax rounded px-4 py-2 text-xs"
          aria-label="Next pages"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
