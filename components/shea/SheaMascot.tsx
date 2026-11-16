"use client";

import { motion } from "framer-motion";

export type SheaState = "idle" | "thinking" | "talking";

// Trig/rounding results can differ in their last float digits between the
// server and client JS engines, which breaks SSR hydration when used as raw
// SVG attrs. Rounding to a fixed precision keeps serialized markup stable.
function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * S.H.E.A. — Smart Helpful Electronic Assistant.
 * A hooded librarian-familiar: chocolate cloak with antique-gold stitching,
 * brass mechanical hands cradling a miniature grimoire, and a floating
 * sky-blue tuning crystal cupped in a brass antenna above the hood. Rendered
 * as inline SVG with framer-motion state animations.
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
  const thinking = state === "thinking";
  const talking = state === "talking";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Talk to S.H.E.A., keeper of the archives"
      className="shea-glow relative cursor-pointer select-none bg-transparent"
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: talking ? 2.2 : 3.6, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
    >
      <svg viewBox="0 0 300 330" width={size} height={size * 1.1} fill="none" aria-hidden>
        <defs>
          <linearGradient id="shea-cloak" x1="20%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#624331" />
            <stop offset="45%" stopColor="#4A3123" />
            <stop offset="85%" stopColor="#332016" />
            <stop offset="100%" stopColor="#24150E" />
          </linearGradient>
          <radialGradient id="shea-hood-interior" cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor="#1A2C38" />
            <stop offset="55%" stopColor="#1E140E" />
            <stop offset="100%" stopColor="#120B07" />
          </radialGradient>
          <radialGradient id="shea-skin" cx="46%" cy="40%" r="58%">
            <stop offset="0%" stopColor="#FBE9D7" />
            <stop offset="62%" stopColor="#EED1B7" />
            <stop offset="88%" stopColor="#D6B092" />
            <stop offset="100%" stopColor="#BC9173" />
          </radialGradient>
          <radialGradient id="shea-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E58D7A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E58D7A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shea-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3D678" />
            <stop offset="35%" stopColor="#C99E38" />
            <stop offset="70%" stopColor="#8F6A1B" />
            <stop offset="100%" stopColor="#D9B24C" />
          </linearGradient>
          <linearGradient id="shea-brass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8C6A28" />
            <stop offset="30%" stopColor="#E4C165" />
            <stop offset="60%" stopColor="#B38932" />
            <stop offset="100%" stopColor="#694D18" />
          </linearGradient>
          <linearGradient id="shea-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="45%" stopColor="#94A3B8" />
            <stop offset="80%" stopColor="#475569" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <radialGradient id="shea-iris" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="75%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </radialGradient>
          <linearGradient id="shea-crystal-l" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="shea-crystal-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="55%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>
          <linearGradient id="shea-leather" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C4D2B" />
            <stop offset="50%" stopColor="#5C361B" />
            <stop offset="100%" stopColor="#3B200E" />
          </linearGradient>
          <linearGradient id="shea-pages" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F7DF94" />
            <stop offset="50%" stopColor="#D4A843" />
            <stop offset="100%" stopColor="#9A7320" />
          </linearGradient>
          <filter id="shea-crystal-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b1" />
            <feGaussianBlur stdDeviation="10" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="shea-eye-l-clip">
            <ellipse cx="121" cy="130" rx="17" ry="18" />
          </clipPath>
          <clipPath id="shea-eye-r-clip">
            <ellipse cx="179" cy="130" rx="17" ry="18" />
          </clipPath>
        </defs>

        {/* floating rune ring beneath S.H.E.A. */}
        <motion.ellipse
          cx="150"
          cy="312"
          rx="54"
          ry="8"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* brass antenna cradle + crystal */}
        <g>
          {/* arcane rings — visible while thinking */}
          <motion.g
            style={{ originX: "150px", originY: "40px" }}
            animate={{ rotate: thinking ? 360 : 0, opacity: thinking ? 0.85 : 0 }}
            transition={{ rotate: { duration: 7, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.3 } }}
          >
            <circle cx="150" cy="40" r="22" stroke="#38BDF8" strokeWidth="1.1" strokeDasharray="3 5" />
            <circle cx="150" cy="18" r="1.8" fill="#BAE6FD" />
            <circle cx="150" cy="62" r="1.8" fill="#BAE6FD" />
            <circle cx="128" cy="40" r="1.8" fill="#BAE6FD" />
            <circle cx="172" cy="40" r="1.8" fill="#BAE6FD" />
          </motion.g>

          <rect x="143" y="62" width="14" height="8" rx="3" fill="url(#shea-brass)" stroke="#23140C" strokeWidth="1" />
          <path
            d="M 136 48 L 136 56 C 136 63, 164 63, 164 56 L 164 48"
            fill="none"
            stroke="url(#shea-silver)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="136" cy="47" r="3" fill="url(#shea-gold)" stroke="#23140C" strokeWidth="0.8" />
          <circle cx="164" cy="47" r="3" fill="url(#shea-gold)" stroke="#23140C" strokeWidth="0.8" />

          <motion.g
            filter="url(#shea-crystal-glow)"
            style={{ originX: "150px", originY: "38px" }}
            animate={
              thinking
                ? { y: [-2, -6, -2], scale: [1.05, 1.14, 1.05] }
                : { y: [0, -4, 0], scale: [1, 1.03, 1] }
            }
            transition={{ duration: thinking ? 1.3 : 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="150" cy="37" rx="11" ry="16" fill="#38BDF8" opacity="0.28" />
            <polygon points="150,22 142,34 144,48 150,53" fill="url(#shea-crystal-l)" stroke="#E0F2FE" strokeWidth="0.6" />
            <polygon points="150,22 158,34 156,48 150,53" fill="url(#shea-crystal-r)" stroke="#7DD3FC" strokeWidth="0.6" />
            <polygon points="150,27 146,35 150,48 154,35" fill="#E0F2FE" opacity="0.65" />
            <circle cx="147" cy="30" r="1.4" fill="#FFFFFF" />
          </motion.g>
        </g>

        {/* hood dome */}
        <path
          d="M150 68 C 100 68 68 118 72 166 C 76 192 100 204 150 204 C 200 204 224 192 228 166 C 232 118 200 68 150 68 Z"
          fill="url(#shea-cloak)"
          stroke="#22130B"
          strokeWidth="1.6"
        />
        <path
          d="M80 160 C 79 117 106 76 150 76 C 194 76 221 117 220 160"
          fill="none"
          stroke="url(#shea-gold)"
          strokeWidth="2"
          strokeDasharray="8 3 2 3"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* hood interior shadow */}
        <path
          d="M150 82 C 108 82 86 120 90 162 C 93 183 114 194 150 194 C 186 194 207 183 210 162 C 214 120 192 82 150 82 Z"
          fill="url(#shea-hood-interior)"
          stroke="#140C07"
          strokeWidth="1.4"
        />
        <path
          d="M94 159 C 98 180 120 190 150 190 C 180 190 202 180 206 159"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.8"
          opacity="0.28"
        />

        {/* brass ear pods */}
        <rect x="80" y="120" width="9" height="22" rx="4" fill="url(#shea-brass)" stroke="#23140C" strokeWidth="1" />
        <circle cx="84.5" cy="131" r="3" fill="#38BDF8" opacity="0.75" />
        <rect x="211" y="120" width="9" height="22" rx="4" fill="url(#shea-brass)" stroke="#23140C" strokeWidth="1" />
        <circle cx="215.5" cy="131" r="3" fill="#38BDF8" opacity="0.75" />

        {/* face */}
        <g>
          <path
            d="M150 92 C 114 92 97 115 98 143 C 99 168 119 182 150 182 C 181 182 201 168 202 143 C 203 115 186 92 150 92 Z"
            fill="url(#shea-skin)"
            stroke="#8F674D"
            strokeWidth="1"
          />
          {/* forehead plate + sensor gem */}
          <path
            d="M 133 96 C 141 92 159 92 167 96 L 163 106 C 155 109 145 109 137 106 Z"
            fill="url(#shea-brass)"
            stroke="#2A1A0E"
            strokeWidth="1"
          />
          <circle cx="150" cy="99" r="2.8" fill="#38BDF8" stroke="#1E293B" strokeWidth="0.6" />

          {/* cheek blush */}
          <ellipse cx="113" cy="149" rx="11" ry="7" fill="url(#shea-blush)" />
          <ellipse cx="187" cy="149" rx="11" ry="7" fill="url(#shea-blush)" />

          {/* eyebrows — morph with mood */}
          <motion.path
            stroke="#6E4934"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: thinking
                ? "M 110 119 Q 122 116 133 120"
                : talking
                  ? "M 110 116 Q 122 111 133 116"
                  : "M 110 118 Q 122 113 133 118",
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.path
            stroke="#6E4934"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: thinking
                ? "M 167 120 Q 178 116 190 119"
                : talking
                  ? "M 167 116 Q 178 111 190 116"
                  : "M 167 118 Q 178 113 190 118",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* left eye */}
          <ellipse cx="121" cy="130" rx="18.5" ry="19.5" fill="#9A7258" opacity="0.35" />
          <ellipse cx="121" cy="130" rx="17" ry="18" fill="#F8FAFC" stroke="#4A3224" strokeWidth="1.2" />
          <g clipPath="url(#shea-eye-l-clip)">
            <circle cx="121" cy="130" r="12" fill="url(#shea-iris)" />
            <circle cx="121" cy="130" r="6.2" fill="#071926" />
            <ellipse cx="117" cy="125" rx="3.2" ry="2.4" fill="#FFFFFF" opacity="0.95" />
            <motion.rect
              x="104"
              y="112"
              width="34"
              rx="1"
              fill="#DFB89B"
              stroke="#6E4934"
              strokeWidth="1"
              animate={{ height: [0, 0, 36, 0, 0] }}
              transition={{ duration: 4.2, times: [0, 0.46, 0.5, 0.54, 1], repeat: Infinity }}
            />
          </g>

          {/* right eye */}
          <ellipse cx="179" cy="130" rx="18.5" ry="19.5" fill="#9A7258" opacity="0.35" />
          <ellipse cx="179" cy="130" rx="17" ry="18" fill="#F8FAFC" stroke="#4A3224" strokeWidth="1.2" />
          <g clipPath="url(#shea-eye-r-clip)">
            <circle cx="179" cy="130" r="12" fill="url(#shea-iris)" />
            <circle cx="179" cy="130" r="6.2" fill="#071926" />
            <ellipse cx="175" cy="125" rx="3.2" ry="2.4" fill="#FFFFFF" opacity="0.95" />
            <motion.rect
              x="162"
              y="112"
              width="34"
              rx="1"
              fill="#DFB89B"
              stroke="#6E4934"
              strokeWidth="1"
              animate={{ height: [0, 0, 36, 0, 0] }}
              transition={{ duration: 4.2, times: [0, 0.46, 0.5, 0.54, 1], repeat: Infinity, delay: 0.08 }}
            />
          </g>

          {/* nose */}
          <ellipse cx="150" cy="144" rx="4.5" ry="3.3" fill="#DDA488" />

          {/* mouth — morphs with mood */}
          <motion.path
            stroke="#7A4B36"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: talking
                ? "M 142 157 Q 150 164 158 157"
                : thinking
                  ? "M 145 158 Q 150 160 155 158"
                  : "M 142 156 Q 150 161 158 156",
            }}
            transition={{ duration: 0.3 }}
          />
        </g>

        {/* mechanical hands + miniature grimoire */}
        <g>
          {/* glow when thinking/consulting the tome */}
          <motion.ellipse
            cx="146"
            cy="235"
            rx="42"
            ry="30"
            fill="#38BDF8"
            filter="url(#shea-crystal-glow)"
            animate={{ opacity: thinking ? 0.55 : 0.08 }}
            transition={{ duration: 0.4 }}
          />

          {/* book */}
          <path d="M 118 219 L 168 227 L 168 258 L 118 250 Z" fill="#2A160B" stroke="#1A0D06" strokeWidth="1" />
          <path d="M 118 219 L 125 215 L 174 223 L 168 227 Z" fill="url(#shea-pages)" stroke="#5E4312" strokeWidth="0.6" />
          <path d="M 168 227 L 174 223 L 174 254 L 168 258 Z" fill="url(#shea-pages)" stroke="#5E4312" strokeWidth="0.6" />
          <path d="M 115 220 L 166 228 L 166 259 L 115 251 Z" fill="url(#shea-leather)" stroke="#231208" strokeWidth="1.1" />
          <path d="M 120 232 L 162 238 L 162 243 L 120 237 Z" fill="none" stroke="url(#shea-gold)" strokeWidth="0.8" />
          <circle cx="140" cy="243" r="7" fill="none" stroke="url(#shea-gold)" strokeWidth="0.9" />
          <motion.circle
            cx="140"
            cy="243"
            r="1.8"
            fill="#38BDF8"
            animate={{ opacity: thinking ? [0.6, 1, 0.6] : [0.9, 1, 0.9] }}
            transition={{ duration: thinking ? 0.6 : 2, repeat: Infinity }}
          />

          {/* left hand */}
          <rect x="99" y="236" width="10" height="13" rx="2.5" transform="rotate(-8 99 236)" fill="url(#shea-brass)" stroke="#23140C" strokeWidth="0.8" />
          <rect x="107" y="235" width="11" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />
          <rect x="107" y="240" width="12" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />
          <rect x="107" y="245" width="11" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />

          {/* right hand */}
          <rect x="179" y="241" width="10" height="13" rx="2.5" transform="rotate(8 179 241)" fill="url(#shea-brass)" stroke="#23140C" strokeWidth="0.8" />
          <rect x="167" y="240" width="11" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />
          <rect x="166" y="245" width="12" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />
          <rect x="168" y="250" width="10" height="4" rx="2" fill="url(#shea-silver)" stroke="#1E293B" strokeWidth="0.6" />
        </g>

        {/* talking equalizer bars beneath the chin */}
        {talking && (
          <g>
            {[136, 144, 156, 164].map((x, i) => (
              <motion.rect
                key={x}
                x={x - 1.6}
                width="3.2"
                rx="1.2"
                fill="#38BDF8"
                animate={{ height: [4, 11, 4], y: [206, 199.5, 206] }}
                transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </g>
        )}

        {/* thinking runes orbiting the hood */}
        {thinking && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ originX: "150px", originY: "130px" }}
          >
            {["✶", "ᚱ", "✧"].map((rune, i) => {
              const a = (i * Math.PI * 2) / 3;
              return (
                <text
                  key={rune}
                  x={r(150 + Math.cos(a) * 72)}
                  y={r(130 + Math.sin(a) * 62)}
                  fill="var(--gold-bright)"
                  fontSize="13"
                  opacity="0.9"
                >
                  {rune}
                </text>
              );
            })}
          </motion.g>
        )}
      </svg>
    </motion.button>
  );
}
