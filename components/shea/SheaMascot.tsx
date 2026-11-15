"use client";

import { motion } from "framer-motion";

export type SheaState = "idle" | "thinking" | "talking";

function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * S.H.E.A. — Smart Helpful Electronic Assistant.
 * An original mascot: a small hooded owl-like archive familiar with a brass
 * faceplate, glowing eyes and a floating rune. Rendered as inline SVG with
 * framer-motion state animations.
 */
export default function SheaMascot({
  state = "idle",
  size = 150,
  onClick,
}: {
  state?: SheaState;
  size?: number;
  onClick?: () => void;
}) {
  const eyeColor = state === "thinking" ? "#ffd27e" : "#7ed3ff";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Talk to S.H.E.A., keeper of the archives"
      className="shea-glow relative cursor-pointer select-none bg-transparent"
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: state === "talking" ? 2.2 : 3.6, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
    >
      <svg viewBox="0 0 160 170" width={size} height={size * 1.0625} fill="none" aria-hidden>
        {/* floating rune ring under the familiar */}
        <motion.ellipse
          cx="80"
          cy="156"
          rx="34"
          ry="7"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* antenna */}
        <path d="M80 18 L80 8" stroke="#8a7350" strokeWidth="2.5" strokeLinecap="round" />
        <motion.circle
          cx="80"
          cy="6"
          r="3.5"
          fill={eyeColor}
          animate={{ opacity: state === "thinking" ? [0.5, 1, 0.5] : [0.7, 1, 0.7] }}
          transition={{ duration: state === "thinking" ? 0.7 : 2.4, repeat: Infinity }}
        />

        {/* hood / cloak silhouette */}
        <path
          d="M80 14
             C 46 14 30 42 28 70
             C 26 96 34 120 30 146
             C 50 158 62 150 80 158
             C 98 150 110 158 130 146
             C 126 120 134 96 132 70
             C 130 42 114 14 80 14 Z"
          fill="#2e1b12"
          stroke="#1c100a"
          strokeWidth="2"
        />
        {/* cloak inner shading */}
        <path
          d="M80 20 C 52 20 36 44 34 70 C 33 90 38 110 36 138 C 52 147 64 142 80 149 Z"
          fill="#3a2417"
          opacity="0.8"
        />
        {/* gold trim on hood */}
        <path
          d="M44 52 C 50 30 64 20 80 20 C 96 20 110 30 116 52"
          stroke="var(--gold)"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* face plate (brass) inside hood */}
        <ellipse cx="80" cy="66" rx="34" ry="30" fill="#17110c" />
        <ellipse cx="80" cy="65" rx="31" ry="27" fill="url(#brass)" />

        {/* eyes */}
        <motion.g
          animate={
            state === "thinking"
              ? { y: -3 }
              : state === "talking"
                ? { y: [0, 0.8, 0] }
                : { y: 0 }
          }
          transition={state === "talking" ? { duration: 0.5, repeat: Infinity } : { duration: 0.4 }}
        >
          {/* blink wrapper */}
          <motion.g
            style={{ originX: "80px", originY: "62px" }}
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            transition={{ duration: 4.5, times: [0, 0.46, 0.5, 0.54, 1], repeat: Infinity }}
          >
            <circle cx="66" cy="62" r="10" fill="#0d1a20" />
            <circle cx="94" cy="62" r="10" fill="#0d1a20" />
            <motion.circle
              cx="66"
              cy="62"
              r="7"
              fill={eyeColor}
              animate={{ opacity: state === "thinking" ? [0.55, 1, 0.55] : 1 }}
              transition={{ duration: 0.8, repeat: state === "thinking" ? Infinity : 0 }}
            />
            <motion.circle
              cx="94"
              cy="62"
              r="7"
              fill={eyeColor}
              animate={{ opacity: state === "thinking" ? [0.55, 1, 0.55] : 1 }}
              transition={{ duration: 0.8, repeat: state === "thinking" ? Infinity : 0, delay: 0.15 }}
            />
            <circle cx="68.5" cy="59.5" r="2.2" fill="#eafaff" opacity="0.95" />
            <circle cx="96.5" cy="59.5" r="2.2" fill="#eafaff" opacity="0.95" />
          </motion.g>

          {/* beak-like speaker grill */}
          <path d="M76 76 L84 76 L80 83 Z" fill="#8a7350" />
          {/* talking equalizer */}
          {state === "talking" ? (
            <g>
              {[70, 76, 82, 88].map((x, i) => (
                <motion.rect
                  key={x}
                  x={x - 1.2}
                  y={88}
                  width="2.4"
                  rx="1"
                  fill={eyeColor}
                  animate={{ height: [3, 8, 3], y: [88, 85.5, 88] }}
                  transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </g>
          ) : (
            <path d="M72 89 Q80 93 88 89" stroke="#8a7350" strokeWidth="2" strokeLinecap="round" />
          )}
        </motion.g>

        {/* little wing-arms holding a tome */}
        <path d="M46 100 Q 40 116 52 126" stroke="#2e1b12" strokeWidth="10" strokeLinecap="round" />
        <path d="M114 100 Q 120 116 108 126" stroke="#2e1b12" strokeWidth="10" strokeLinecap="round" />
        {/* the tome */}
        <g transform="translate(80 124)">
          <rect x="-22" y="-10" width="44" height="22" rx="2" fill="#5a3d2a" stroke="#3a2417" strokeWidth="1.5" />
          <rect x="-19" y="-7.5" width="38" height="17" rx="1" fill="var(--aged-paper)" />
          <line x1="0" y1="-7.5" x2="0" y2="9.5" stroke="#b9a37c" strokeWidth="1.2" />
          {[-4, 0, 4].map((y) => (
            <g key={y} stroke="#8a7350" strokeWidth="0.9" opacity="0.8">
              <line x1="-15" y1={y} x2="-4" y2={y} />
              <line x1="4" y1={y} x2="15" y2={y} />
            </g>
          ))}
        </g>

        {/* thinking runes orbiting the head */}
        {state === "thinking" && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ originX: "80px", originY: "60px" }}
          >
            {["✶", "ᚱ", "✧"].map((rune, i) => {
              const a = (i * Math.PI * 2) / 3;
              return (
                <text
                  key={rune}
                  x={r(80 + Math.cos(a) * 48)}
                  y={r(60 + Math.sin(a) * 40)}
                  fill="var(--gold-bright)"
                  fontSize="11"
                  opacity="0.9"
                >
                  {rune}
                </text>
              );
            })}
          </motion.g>
        )}

        <defs>
          <radialGradient id="brass" cx="0.4" cy="0.3" r="1">
            <stop offset="0%" stopColor="#d9b98a" />
            <stop offset="55%" stopColor="#a98757" />
            <stop offset="100%" stopColor="#6d5234" />
          </radialGradient>
        </defs>
      </svg>
    </motion.button>
  );
}
