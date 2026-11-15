"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Project, Profile } from "@/lib/types";
import DeskScene from "./book/DeskScene";
import BookCover from "./book/BookCover";
import SheaChat from "./shea/SheaChat";

const FlipBook = dynamic(() => import("./book/FlipBook"), { ssr: false });
const MobileReader = dynamic(() => import("./book/MobileReader"), { ssr: false });

type Stage = "cover" | "opening" | "open";

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
    setStage("opening");
    window.setTimeout(() => setStage("open"), 1050);
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
        setStage("open");
        // give the book a tick to mount before jumping
        window.setTimeout(() => jumpRef.current?.(slug), 450);
      } else {
        jumpRef.current?.(slug);
      }
    },
    [stage],
  );

  return (
    <DeskScene>
      <AnimatePresence mode="wait">
        {stage !== "open" ? (
          <motion.div key="cover" exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <BookCover opening={stage === "opening"} onOpen={openBook} />
          </motion.div>
        ) : (
          <motion.div
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
              />
            ) : (
              <div className="flex min-h-dvh items-center justify-center px-4 py-10">
                <FlipBook
                  projects={projects}
                  profile={profile}
                  onProjectViewed={onProjectViewed}
                  jumpRef={jumpRef}
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
    </DeskScene>
  );
}
