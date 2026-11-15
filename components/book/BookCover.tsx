"use client";

import { motion } from "framer-motion";
import Emblem from "./Emblem";

/**
 * The closed tome resting on the desk, with the "Open the Archives" call.
 * On open, the front board swings away (3D) and the parent swaps in the book.
 */
export default function BookCover({
  opening,
  onOpen,
}: {
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ perspective: 2000 }}
        className="relative"
      >
        {/* book block (page edges + back board) */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-2 rounded-r-md rounded-l-sm"
          style={{
            background: "repeating-linear-gradient(0deg, #cbb690 0 2px, #b09a74 2px 4px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
          }}
        />

        {/* front board */}
        <motion.button
          type="button"
          onClick={onOpen}
          disabled={opening}
          aria-label="Open the Archives"
          className="texture-leather group relative block cursor-pointer overflow-hidden rounded-r-md rounded-l-sm px-7 py-10 text-center sm:px-10 sm:py-14"
          style={{
            // Explicit width AND height, not `aspectRatio`: aspect-ratio is
            // only a *preference* for an empty box — this button's own text
            // content can still force it taller once it doesn't fit, which
            // is exactly what outgrew short viewports and forced a page
            // scroll. Both formulas below independently pick from the same
            // three (width, height) pairs, so whichever branch wins always
            // keeps the 3:4.1 ratio and never exceeds the height budget.
            width: "min(86vw, 420px, calc((100dvh - 140px) * 3 / 4.1))",
            height: "min(117.54vw, 574.03px, calc(100dvh - 140px))",
            transformOrigin: "left center",
            transformStyle: "preserve-3d",
            boxShadow:
              "inset 0 0 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(180,154,98,0.25), 0 18px 50px rgba(0,0,0,0.7)",
          }}
          animate={opening ? { rotateY: -112, opacity: 0.2 } : { rotateY: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.645, 0.045, 0.355, 1] }}
          whileHover={opening ? undefined : { scale: 1.012 }}
        >
          {/* spine shadow */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-8 rounded-l-sm bg-gradient-to-r from-black/50 to-transparent" />
          {/* gold frame */}
          <div aria-hidden className="pointer-events-none absolute inset-3 rounded-sm border border-[rgba(180,154,98,0.45)]" />
          <div aria-hidden className="pointer-events-none absolute inset-4 rounded-sm border border-[rgba(180,154,98,0.2)]" />
          {/* corner flourishes */}
          {["left-3 top-3", "right-3 top-3 -scale-x-100", "left-3 bottom-3 -scale-y-100", "right-3 bottom-3 -scale-100"].map(
            (cls) => (
              <svg key={cls} aria-hidden viewBox="0 0 40 40" className={`absolute h-8 w-8 ${cls}`} fill="none">
                <path d="M2 38 L2 10 Q2 2 10 2 L38 2" stroke="var(--gold)" strokeWidth="2" />
                <path d="M6 30 Q6 6 30 6" stroke="var(--gold)" strokeWidth="1" opacity="0.6" />
                <circle cx="10" cy="10" r="2" fill="var(--gold)" opacity="0.8" />
              </svg>
            ),
          )}

          <div className="relative flex h-full flex-col items-center justify-between gap-4">
            <p className="font-fell text-[11px] tracking-[0.3em] text-[var(--gold)] opacity-80 sm:text-xs">
              EX LIBRIS
            </p>

            <div>
              <h1 className="font-display text-2xl font-bold leading-snug tracking-[0.12em] text-[var(--gold-bright)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:text-[1.9rem]">
                THE ARCHIVES
                <span className="mt-1 block text-base font-semibold tracking-[0.2em] sm:text-lg">
                  OF WASAM HAIDER
                </span>
              </h1>
              <div className="gold-rule mx-auto mt-4 w-40" />
              <p className="font-fell mt-3 text-sm italic text-[var(--parchment)] opacity-90 sm:text-base">
                A Chronicle of Code, Creation &amp; Discovery
              </p>
            </div>

            <Emblem size={120} className="opacity-90 drop-shadow-[0_0_14px_rgba(180,154,98,0.3)]" />

            <div className="btn-wax rounded px-6 py-2.5 text-xs sm:text-sm">
              {opening ? "Unsealing…" : "Open the Archives"}
            </div>
          </div>
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 0.7 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="font-fell mt-8 text-center text-sm italic text-[var(--parchment)]"
      >
        Within these pages lie the works of a maker of software.
      </motion.p>
    </div>
  );
}
