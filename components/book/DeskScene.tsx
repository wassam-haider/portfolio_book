/**
 * Full-screen ambient environment: dark study, wooden desk, candlelight,
 * floating dust. Pure CSS — renders on the server.
 */

// Deterministic mote configs (avoid hydration mismatches from Math.random).
const MOTES = [
  { left: "8%", t: "19s", d: "0s", x: "40px", o: 0.45 },
  { left: "16%", t: "23s", d: "4s", x: "-30px", o: 0.3 },
  { left: "27%", t: "17s", d: "8s", x: "25px", o: 0.5 },
  { left: "38%", t: "26s", d: "2s", x: "-45px", o: 0.35 },
  { left: "49%", t: "20s", d: "10s", x: "35px", o: 0.45 },
  { left: "58%", t: "24s", d: "6s", x: "-20px", o: 0.3 },
  { left: "67%", t: "18s", d: "12s", x: "30px", o: 0.5 },
  { left: "76%", t: "22s", d: "3s", x: "-35px", o: 0.4 },
  { left: "85%", t: "25s", d: "9s", x: "20px", o: 0.3 },
  { left: "93%", t: "21s", d: "5s", x: "-25px", o: 0.45 },
  { left: "21%", t: "28s", d: "14s", x: "15px", o: 0.25 },
  { left: "71%", t: "27s", d: "11s", x: "-15px", o: 0.25 },
];

export default function DeskScene({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh overflow-hidden bg-[var(--walnut-deep)]">
      {/* back wall: deep vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, var(--deep-brown) 0%, var(--walnut) 55%, var(--walnut-deep) 100%)",
        }}
      />

      {/* candle glow, upper corners */}
      <div
        aria-hidden
        className="candle-glow absolute -left-32 -top-24 h-[55vh] w-[55vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,180,94,0.17) 0%, rgba(255,180,94,0.05) 45%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="candle-glow absolute -right-40 top-10 h-[65vh] w-[65vh] rounded-full"
        style={{
          animationDelay: "1.4s",
          background:
            "radial-gradient(circle, rgba(255,180,94,0.13) 0%, rgba(255,180,94,0.04) 45%, transparent 70%)",
        }}
      />

      {/* desk surface */}
      <div aria-hidden className="texture-wood absolute inset-x-0 bottom-0 h-[42vh]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,180,94,0.07) 0%, transparent 30%), radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,180,94,0.1), transparent 70%), linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* desk edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,184,120,0.35)] to-transparent" />
      </div>

      {/* decorative stacked books, left of desk (hidden on small screens) */}
      <div aria-hidden className="absolute bottom-[6vh] left-[4vw] hidden select-none lg:block">
        <div className="h-5 w-44 rounded-sm bg-[#3a2417] shadow-lg" style={{ transform: "rotate(-1.5deg)" }}>
          <div className="mx-3 mt-2 h-px bg-[rgba(180,154,98,0.4)]" />
        </div>
        <div className="-mt-1 h-6 w-48 rounded-sm bg-[#2b1a10] shadow-lg" style={{ transform: "rotate(1deg)" }}>
          <div className="mx-4 mt-2.5 h-px bg-[rgba(180,154,98,0.3)]" />
        </div>
        <div className="-mt-1 h-5 w-40 rounded-sm bg-[#47301f] shadow-lg">
          <div className="mx-3 mt-2 h-px bg-[rgba(180,154,98,0.35)]" />
        </div>
      </div>

      {/* candle, right of desk */}
      <div aria-hidden className="absolute bottom-[10vh] right-[6vw] hidden select-none lg:block">
        <div className="candle-glow mx-auto h-7 w-3 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 30%, #ffe9b8 0%, #ffb45e 45%, rgba(255,120,40,0.8) 75%, transparent 100%)",
            boxShadow: "0 0 24px 8px rgba(255,180,94,0.35)",
          }}
        />
        <div className="mx-auto -mt-0.5 h-16 w-6 rounded-sm bg-gradient-to-b from-[#e8dcc0] to-[#bfae8a]" />
        <div className="mx-auto -mt-0.5 h-2 w-12 rounded-full bg-[#5a4630] shadow-md" />
      </div>

      {/* floating dust */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="dust-mote"
            style={
              {
                left: m.left,
                "--dust-t": m.t,
                "--dust-d": m.d,
                "--dust-x": m.x,
                "--dust-o": m.o,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* content */}
      <div className="relative z-10 h-full">{children}</div>

      {/* overall vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 45%, transparent 55%, rgba(14,8,5,0.55) 100%)",
        }}
      />
    </div>
  );
}
