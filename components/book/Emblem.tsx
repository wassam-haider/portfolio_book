// Trig results can differ in their last float digits between the server and
// client JS engines, which breaks SSR hydration when used as raw SVG attrs.
// Rounding to a fixed precision keeps the serialized markup byte-identical.
function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Original fantasy emblem for the archive: an open tome radiating light,
 * crowned by a watching eye-star, ringed by laurels and runic ticks.
 */
export default function Emblem({ size = 140, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden
      fill="none"
    >
      {/* outer ring with runic ticks */}
      <circle cx="100" cy="100" r="92" stroke="var(--gold)" strokeWidth="2" opacity="0.9" />
      <circle cx="100" cy="100" r="84" stroke="var(--gold)" strokeWidth="0.8" opacity="0.55" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 24;
        const x1 = r(100 + Math.cos(a) * 86);
        const y1 = r(100 + Math.sin(a) * 86);
        const x2 = r(100 + Math.cos(a) * 90);
        const y2 = r(100 + Math.sin(a) * 90);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--gold)"
            strokeWidth={i % 6 === 0 ? 2 : 1}
            opacity={i % 6 === 0 ? 0.9 : 0.5}
          />
        );
      })}

      {/* laurel arcs */}
      <path
        d="M30 128 Q44 160 78 172"
        stroke="var(--gold)"
        strokeWidth="1.6"
        opacity="0.8"
      />
      <path
        d="M170 128 Q156 160 122 172"
        stroke="var(--gold)"
        strokeWidth="1.6"
        opacity="0.8"
      />
      {[0.15, 0.35, 0.55, 0.75, 0.95].map((t, i) => {
        const x = 30 + (78 - 30) * t;
        const yBase = 128 + (172 - 128) * t;
        return (
          <g key={`l${i}`}>
            <path
              d={`M${x} ${yBase} q-9 -7 -13 -16`}
              stroke="var(--gold)"
              strokeWidth="1.3"
              opacity="0.75"
            />
            <path
              d={`M${200 - x} ${yBase} q9 -7 13 -16`}
              stroke="var(--gold)"
              strokeWidth="1.3"
              opacity="0.75"
            />
          </g>
        );
      })}

      {/* radiant beams above the book */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = Math.PI + (Math.PI * (i + 1)) / 8;
        const x1 = r(100 + Math.cos(a) * 34);
        const y1 = r(104 + Math.sin(a) * 30);
        const x2 = r(100 + Math.cos(a) * 54);
        const y2 = r(104 + Math.sin(a) * 50);
        return (
          <line
            key={`b${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--gold-bright)"
            strokeWidth="1.4"
            opacity="0.8"
          />
        );
      })}

      {/* the watching eye-star */}
      <g transform="translate(100 52)">
        <path
          d="M0 -14 L3.2 -4.2 L13 -4.2 L5 1.8 L8 11.5 L0 5.6 L-8 11.5 L-5 1.8 L-13 -4.2 L-3.2 -4.2 Z"
          fill="var(--gold-bright)"
          opacity="0.95"
        />
        <circle cx="0" cy="0" r="3" fill="var(--walnut)" />
      </g>

      {/* open tome */}
      <g transform="translate(100 112)">
        {/* cover */}
        <path
          d="M-46 10 Q-46 24 -40 26 L-2 36 Q0 37 2 36 L40 26 Q46 24 46 10 L46 6 L0 18 L-46 6 Z"
          fill="var(--gold)"
          opacity="0.9"
        />
        {/* left pages */}
        <path
          d="M-44 -14 Q-22 -26 0 -12 L0 20 Q-22 6 -44 14 Z"
          fill="var(--aged-paper)"
          stroke="var(--gold)"
          strokeWidth="1.4"
        />
        {/* right pages */}
        <path
          d="M44 -14 Q22 -26 0 -12 L0 20 Q22 6 44 14 Z"
          fill="var(--aged-paper)"
          stroke="var(--gold)"
          strokeWidth="1.4"
        />
        {/* script lines */}
        {[-6, 0, 6].map((y, i) => (
          <g key={`t${i}`}>
            <path d={`M-36 ${y - 2} Q-20 ${y - 8} -6 ${y - 1}`} stroke="var(--coffee)" strokeWidth="1.1" opacity="0.8" />
            <path d={`M36 ${y - 2} Q20 ${y - 8} 6 ${y - 1}`} stroke="var(--coffee)" strokeWidth="1.1" opacity="0.8" />
          </g>
        ))}
      </g>
    </svg>
  );
}
