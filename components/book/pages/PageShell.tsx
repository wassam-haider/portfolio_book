"use client";

import { forwardRef } from "react";

/**
 * A single physical page inside the flip book. react-pageflip requires each
 * page to be a ref-forwarding block element.
 */
interface PageShellProps {
  side: "left" | "right";
  pageNumber?: number;
  children: React.ReactNode;
  className?: string;
}

const PageShell = forwardRef<HTMLDivElement, PageShellProps>(function PageShell(
  { side, pageNumber, children, className = "" },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`page-paper relative h-full w-full overflow-hidden ${
        side === "left" ? "page-edge-left rounded-l-sm" : "page-edge-right rounded-r-sm"
      } ${className}`}
    >
      <div className="flex h-full flex-col px-6 py-6 sm:px-8 sm:py-8">{children}</div>
      {pageNumber !== undefined && (
        <span
          className={`font-fell absolute bottom-3 text-xs text-[var(--coffee)] opacity-80 ${
            side === "left" ? "left-6" : "right-6"
          }`}
        >
          {pageNumber}
        </span>
      )}
    </div>
  );
});

export default PageShell;
