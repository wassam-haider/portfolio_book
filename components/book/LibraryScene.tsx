"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The Forgotten Archives — full-screen Three.js environment.
 *
 * A candlelit walnut library (stone pillars, towering bookshelves, god rays,
 * drifting golden dust) with the hero artifact floating above the study desk:
 * a procedurally-textured leather grimoire with gold filigree, raised spine
 * ribs and metal corner brackets. Clicking the grimoire opens the archive.
 */

interface LibrarySceneProps {
  title: string;
  subtitle: string;
  /** When true the front cover swings open and the book settles flat. */
  bookOpen: boolean;
  onBookClick: () => void;
}

/* ----------------------------------------------------------------------
 * Procedural texture helpers (no external images)
 * -------------------------------------------------------------------- */

function makePRNG(seedStart: number) {
  let seed = seedStart;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function createWalnutWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const rand = makePRNG(421337);

  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, "#21150F");
  grad.addColorStop(0.5, "#332016");
  grad.addColorStop(1, "#1d120c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 420; i++) {
    const y = rand() * 1024;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(18, 10, 6, 0.42)" : "rgba(118, 81, 57, 0.16)";
    ctx.lineWidth = 1 + rand() * 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let currentY = y;
    for (let x = 0; x <= 1024; x += 64) {
      currentY += (rand() - 0.5) * 6;
      ctx.lineTo(x, currentY);
    }
    ctx.stroke();
  }

  for (let k = 0; k < 14; k++) {
    ctx.strokeStyle = "rgba(15, 8, 5, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      rand() * 1024,
      rand() * 1024,
      18 + rand() * 45,
      4 + rand() * 10,
      (rand() - 0.5) * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const rand = makePRNG(90553);

  ctx.fillStyle = "#1d1a18";
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const colW = 512 / cols;
    const offset = (r % 2) * (colW / 2);
    for (let c = -1; c <= cols; c++) {
      const shade = 24 + Math.floor(rand() * 16);
      ctx.fillStyle = `rgb(${shade + 4}, ${shade + 1}, ${shade - 2})`;
      ctx.fillRect(c * colW + offset + 2, r * rowH + 2, colW - 4, rowH - 4);
    }
  }

  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,245,230,0.03)" : "rgba(0,0,0,0.22)";
    ctx.fillRect(rand() * 512, rand() * 512, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 244, 200, 1)");
  grad.addColorStop(0.35, "rgba(229, 198, 126, 0.75)");
  grad.addColorStop(1, "rgba(180, 154, 98, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Resolve the real (next/font generated) family name behind a CSS variable. */
function displayFontFamily(): string {
  try {
    const fam = getComputedStyle(document.body).getPropertyValue("--font-display").trim();
    if (fam) return fam;
  } catch {
    /* SSR / detached */
  }
  return "Cinzel, Georgia, serif";
}

interface CoverMaps {
  diffuseTex: THREE.CanvasTexture;
  bumpTex: THREE.CanvasTexture;
  roughTex: THREE.CanvasTexture;
}

/**
 * Embossed dark-leather cover with antique gold filigree borders, corner
 * acanthus scrolls, a central open-book medallion with an 8-point star, and
 * the archive title/subtitle tooled in gold. Returns diffuse + bump +
 * roughness maps so the gold reads as raised metal under light.
 */
function createBookCoverTextures(opts: {
  withText: boolean;
  title: string;
  subtitle: string;
}): CoverMaps {
  const width = 1024;
  const height = 1400;

  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const ctx = diffCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext("2d")!;

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext("2d")!;

  // Deep dark walnut / burnt chocolate leather base
  const baseGrad = ctx.createRadialGradient(
    width * 0.52,
    height * 0.48,
    80,
    width * 0.5,
    height * 0.5,
    height * 0.72,
  );
  baseGrad.addColorStop(0, "#3b2316");
  baseGrad.addColorStop(0.55, "#26150c");
  baseGrad.addColorStop(1, "#140a06");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  bCtx.fillStyle = "#6e6e6e";
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = "#d4d4d4";
  rCtx.fillRect(0, 0, width, height);

  const rand = makePRNG(133742);

  // Leather pebble grain
  for (let i = 0; i < 26000; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 1.1 + rand() * 2.4;
    const shade = rand();
    ctx.fillStyle = shade > 0.5 ? "rgba(68, 41, 25, 0.22)" : "rgba(12, 6, 3, 0.28)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bVal = Math.floor(95 + shade * 42);
    bCtx.fillStyle = `rgba(${bVal},${bVal},${bVal},0.35)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Antique scratches & patina
  for (let i = 0; i < 160; i++) {
    const x1 = rand() * width;
    const y1 = rand() * height;
    const angle = rand() * Math.PI * 2;
    const len = 18 + rand() * 95;
    const x2 = x1 + Math.cos(angle) * len;
    const y2 = y1 + Math.sin(angle) * len;

    ctx.strokeStyle = rand() > 0.35 ? "rgba(88, 55, 34, 0.18)" : "rgba(10, 5, 2, 0.24)";
    ctx.lineWidth = 0.6 + rand() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2 + (rand() - 0.5) * 14, (y1 + y2) / 2 + (rand() - 0.5) * 14, x2, y2);
    ctx.stroke();

    bCtx.strokeStyle = "rgba(45, 45, 45, 0.32)";
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(x1, y1);
    bCtx.lineTo(x2, y2);
    bCtx.stroke();
  }

  type DrawFn = (c: CanvasRenderingContext2D) => void;

  const strokeGold = (drawFn: DrawFn, lineWidth = 3, bright = true) => {
    // Recessed halo
    ctx.strokeStyle = "rgba(10, 5, 2, 0.78)";
    ctx.lineWidth = lineWidth + 3.5;
    drawFn(ctx);
    ctx.stroke();

    const goldGrad = ctx.createLinearGradient(0, 0, width, height);
    goldGrad.addColorStop(0, bright ? "#cfa84e" : "#9c7a38");
    goldGrad.addColorStop(0.35, bright ? "#e5c56b" : "#b89347");
    goldGrad.addColorStop(0.7, bright ? "#b8903d" : "#8a692c");
    goldGrad.addColorStop(1, bright ? "#d9b45b" : "#9e7c39");
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = lineWidth;
    drawFn(ctx);
    ctx.stroke();

    bCtx.strokeStyle = bright ? "#ececec" : "#c8c8c8";
    bCtx.lineWidth = lineWidth + 0.8;
    drawFn(bCtx);
    bCtx.stroke();

    rCtx.strokeStyle = bright ? "#3b3b3b" : "#565656";
    rCtx.lineWidth = lineWidth;
    drawFn(rCtx);
    rCtx.stroke();
  };

  const fillGold = (drawFn: DrawFn) => {
    const goldGrad = ctx.createLinearGradient(width * 0.25, height * 0.25, width * 0.75, height * 0.75);
    goldGrad.addColorStop(0, "#c89f46");
    goldGrad.addColorStop(0.5, "#ebd07a");
    goldGrad.addColorStop(1, "#a67e30");
    ctx.fillStyle = goldGrad;
    drawFn(ctx);
    ctx.fill();

    bCtx.fillStyle = "#f4f4f4";
    drawFn(bCtx);
    bCtx.fill();

    rCtx.fillStyle = "#323232";
    drawFn(rCtx);
    rCtx.fill();
  };

  // Outer border frames
  const padOuter = 68;
  const padInner = 104;
  strokeGold((c) => {
    c.beginPath();
    c.rect(padOuter, padOuter, width - padOuter * 2, height - padOuter * 2);
  }, 4.5, true);
  strokeGold((c) => {
    c.beginPath();
    c.rect(padOuter + 12, padOuter + 12, width - (padOuter + 12) * 2, height - (padOuter + 12) * 2);
  }, 2, false);
  strokeGold((c) => {
    c.beginPath();
    c.rect(padInner, padInner, width - padInner * 2, height - padInner * 2);
  }, 3, true);

  // Diamond guilloche along the border channel
  const step = 28;
  const diamond = (x: number, y: number): DrawFn => (c) => {
    c.beginPath();
    c.moveTo(x, y - 6);
    c.lineTo(x + 6, y);
    c.lineTo(x, y + 6);
    c.lineTo(x - 6, y);
    c.closePath();
  };
  for (let x = padOuter + 24; x <= width - padOuter - 24; x += step) {
    strokeGold(diamond(x, padOuter + 24), 1.6, false);
    strokeGold(diamond(x, height - padOuter - 24), 1.6, false);
  }
  for (let y = padOuter + 24; y <= height - padOuter - 24; y += step) {
    strokeGold(diamond(padOuter + 24, y), 1.6, false);
    strokeGold(diamond(width - padOuter - 24, y), 1.6, false);
  }

  // Inner lobed gothic cartouche frame
  const cx = width / 2;
  const cy = height / 2;
  const frameW = width - 290;
  const frameH = height - 340;
  const left = cx - frameW / 2;
  const right = cx + frameW / 2;
  const top = cy - frameH / 2;
  const bottom = cy + frameH / 2;
  const notch = 68;

  strokeGold((c) => {
    c.beginPath();
    c.moveTo(left + notch, top);
    c.lineTo(right - notch, top);
    c.quadraticCurveTo(right - notch, top + notch, right, top + notch);
    c.lineTo(right, bottom - notch);
    c.quadraticCurveTo(right - notch, bottom - notch, right - notch, bottom);
    c.lineTo(left + notch, bottom);
    c.quadraticCurveTo(left + notch, bottom - notch, left, bottom - notch);
    c.lineTo(left, top + notch);
    c.quadraticCurveTo(left + notch, top + notch, left + notch, top);
    c.closePath();
  }, 3.5, true);

  // Corner acanthus flourishes
  const cornerCoords = [
    { x: padInner + 28, y: padInner + 28, sx: 1, sy: 1 },
    { x: width - padInner - 28, y: padInner + 28, sx: -1, sy: 1 },
    { x: padInner + 28, y: height - padInner - 28, sx: 1, sy: -1 },
    { x: width - padInner - 28, y: height - padInner - 28, sx: -1, sy: -1 },
  ];
  cornerCoords.forEach(({ x, y, sx, sy }) => {
    strokeGold((c) => {
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(x + 75 * sx, y, x + 95 * sx, y + 35 * sy, x + 65 * sx, y + 65 * sy);
      c.bezierCurveTo(x + 40 * sx, y + 88 * sy, x + 15 * sx, y + 55 * sy, x + 38 * sx, y + 38 * sy);
      c.moveTo(x, y);
      c.bezierCurveTo(x, y + 75 * sy, x + 35 * sx, y + 95 * sy, x + 65 * sx, y + 65 * sy);
    }, 2.4, false);
  });

  // Central medallion: concentric rings + open book + star
  const embRadius = 128;
  strokeGold((c) => {
    c.beginPath();
    c.arc(cx, cy, embRadius, 0, Math.PI * 2);
  }, 4, true);
  strokeGold((c) => {
    c.beginPath();
    c.arc(cx, cy, embRadius - 12, 0, Math.PI * 2);
  }, 1.8, false);

  for (let a = 0; a < Math.PI * 2 - 0.001; a += Math.PI / 4) {
    const r1 = embRadius + 4;
    const r2 = embRadius + (Math.abs(a % (Math.PI / 2)) < 0.001 ? 28 : 16);
    strokeGold((c) => {
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    }, 2.4, true);
    fillGold((c) => {
      c.beginPath();
      c.arc(cx + Math.cos(a) * (r2 + 4), cy + Math.sin(a) * (r2 + 4), 4, 0, Math.PI * 2);
    });
  }

  // Miniature open book inside the medallion
  const bookY = cy + 28;
  strokeGold((c) => {
    c.beginPath();
    c.moveTo(cx, bookY + 26);
    c.bezierCurveTo(cx - 24, bookY + 14, cx - 54, bookY + 18, cx - 72, bookY + 26);
    c.lineTo(cx - 64, bookY - 34);
    c.bezierCurveTo(cx - 46, bookY - 42, cx - 22, bookY - 38, cx, bookY - 24);
    c.closePath();
  }, 3.2, true);
  strokeGold((c) => {
    c.beginPath();
    c.moveTo(cx, bookY + 26);
    c.bezierCurveTo(cx + 24, bookY + 14, cx + 54, bookY + 18, cx + 72, bookY + 26);
    c.lineTo(cx + 64, bookY - 34);
    c.bezierCurveTo(cx + 46, bookY - 42, cx + 22, bookY - 38, cx, bookY - 24);
    c.closePath();
  }, 3.2, true);
  strokeGold((c) => {
    c.beginPath();
    c.moveTo(cx - 74, bookY + 32);
    c.bezierCurveTo(cx - 50, bookY + 24, cx - 22, bookY + 24, cx, bookY + 34);
    c.bezierCurveTo(cx + 22, bookY + 24, cx + 50, bookY + 24, cx + 74, bookY + 32);
  }, 2.2, false);
  [-14, -3, 8].forEach((offsetY) => {
    strokeGold((c) => {
      c.beginPath();
      c.moveTo(cx - 50, bookY + offsetY);
      c.quadraticCurveTo(cx - 30, bookY + offsetY - 4, cx - 12, bookY + offsetY + 2);
      c.moveTo(cx + 12, bookY + offsetY + 2);
      c.quadraticCurveTo(cx + 30, bookY + offsetY - 4, cx + 50, bookY + offsetY);
    }, 1.5, false);
  });

  // 8-pointed star above the book
  const starY = cy - 48;
  fillGold((c) => {
    c.beginPath();
    const spikes = 8;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? (i % 4 === 0 ? 28 : 17) : 5.5;
      const ang = (i * Math.PI) / spikes - Math.PI / 2;
      const sx = cx + Math.cos(ang) * rad;
      const sy = starY + Math.sin(ang) * rad;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
  });
  [
    { x: cx - 42, y: starY + 8, r: 3.5 },
    { x: cx + 42, y: starY + 8, r: 3.5 },
    { x: cx - 26, y: starY - 22, r: 2.2 },
    { x: cx + 26, y: starY - 22, r: 2.2 },
  ].forEach((sp) => {
    fillGold((c) => {
      c.beginPath();
      c.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    });
  });

  // Tooled gold typography (title split over two lines + subtitle)
  if (opts.withText) {
    const fam = displayFontFamily();
    const drawGoldText = (text: string, y: number, px: number, weight = 700) => {
      if (!text) return;
      ctx.save();
      ctx.font = `${weight} ${px}px ${fam}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(10, 5, 2, 0.85)";
      ctx.fillText(text, cx + 2, y + 2);
      const tGrad = ctx.createLinearGradient(cx - 240, 0, cx + 240, 0);
      tGrad.addColorStop(0, "#c89f46");
      tGrad.addColorStop(0.5, "#f3dc8b");
      tGrad.addColorStop(1, "#c89f46");
      ctx.fillStyle = tGrad;
      ctx.fillText(text, cx, y);
      ctx.restore();

      bCtx.save();
      bCtx.font = `${weight} ${px}px ${fam}`;
      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";
      bCtx.fillStyle = "#ebebeb";
      bCtx.fillText(text, cx, y);
      bCtx.restore();
    };

    const titleLines = opts.title.toUpperCase().split("\n");
    if (titleLines.length > 1) {
      drawGoldText(titleLines[0], top + 92, 52);
      drawGoldText(titleLines[1], top + 148, 33, 600);
    } else {
      drawGoldText(titleLines[0], top + 115, 44);
    }
    drawGoldText("✦ EX LIBRIS ✦", padOuter + 24, 17, 600);
    drawGoldText(opts.subtitle.toUpperCase(), bottom - 100, 19, 600);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.anisotropy = 8;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.anisotropy = 8;
  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.anisotropy = 8;

  return { diffuseTex, bumpTex, roughTex };
}

/** Aged deckle-edge stacked parchment page block texture. */
function createPageEdgeTextures() {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const bump = document.createElement("canvas");
  bump.width = w;
  bump.height = h;
  const bCtx = bump.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#b89b68");
  grad.addColorStop(0.25, "#dec79b");
  grad.addColorStop(0.75, "#d4ba88");
  grad.addColorStop(1, "#9e7f4d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, w, h);

  const rnd = makePRNG(90210);
  for (let x = 0; x < w; x += 2.2) {
    const tone = rnd();
    ctx.fillStyle =
      tone > 0.5
        ? `rgba(246, 232, 200, ${0.28 + rnd() * 0.35})`
        : `rgba(92, 65, 32, ${0.22 + rnd() * 0.35})`;
    ctx.fillRect(x, 0, 1.4, h);
    const bShade = Math.floor(70 + tone * 140);
    bCtx.fillStyle = `rgb(${bShade},${bShade},${bShade})`;
    bCtx.fillRect(x, 0, 1.4, h);
  }

  for (let i = 0; i < 95; i++) {
    const fx = rnd() * w;
    const fy = rnd() * h;
    const fr = 8 + rnd() * 34;
    const fGrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr);
    fGrad.addColorStop(0, "rgba(86, 56, 24, 0.24)");
    fGrad.addColorStop(1, "rgba(86, 56, 24, 0)");
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  return { map, bumpMap };
}

/** Embossed bronze/gold corner bracket relief bump texture. */
function createMetalFiligreeBump(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#efefef";
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, size - 20, size - 20);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(48, 48, 24, 0, Math.PI * 2);
  ctx.moveTo(48, 72);
  ctx.quadraticCurveTo(95, 110, 155, 48);
  ctx.moveTo(72, 48);
  ctx.quadraticCurveTo(110, 95, 48, 155);
  ctx.stroke();
  [
    [28, 28],
    [size - 34, 28],
    [28, size - 34],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(rx, ry, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}

/* ----------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------- */

export default function LibraryScene({ title, subtitle, bookOpen, onBookClick }: LibrarySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookOpenRef = useRef(bookOpen);
  const onBookClickRef = useRef(onBookClick);
  const titleRef = useRef({ title, subtitle });

  // Refs are read inside the WebGL setup effect's event handlers and
  // animation loop, never during render, so update them from an effect
  // (not the render body) — this one runs after every commit.
  useEffect(() => {
    bookOpenRef.current = bookOpen;
    onBookClickRef.current = onBookClick;
    titleRef.current = { title, subtitle };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL — CSS backdrop behind the canvas stays visible
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#120a06");
    scene.fog = new THREE.FogExp2("#160d08", 0.048);

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 80);
    camera.position.set(0, 1.65, 4.4);

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0);
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(d: T): T => {
      disposables.push(d);
      return d;
    };

    /* ------------------------- shared materials ------------------------- */
    const walnutTex = track(createWalnutWoodTexture());
    const stoneTex = track(createStoneTexture());

    const walnutMat = track(
      new THREE.MeshStandardMaterial({ map: walnutTex, color: 0x3a2419, roughness: 0.42, metalness: 0.08 }),
    );
    const darkWalnutMat = track(
      new THREE.MeshStandardMaterial({ map: walnutTex, color: 0x21150f, roughness: 0.55, metalness: 0.05 }),
    );
    const stoneMat = track(
      new THREE.MeshStandardMaterial({ map: stoneTex, color: 0x2c2622, roughness: 0.85, metalness: 0.05 }),
    );
    const antiqueGoldMat = track(
      new THREE.MeshStandardMaterial({ color: 0xb49a62, roughness: 0.28, metalness: 0.85 }),
    );

    /* ----------------------------- lighting ----------------------------- */
    scene.add(new THREE.AmbientLight(0x3a2618, 2.2));

    const windowLight = new THREE.DirectionalLight(0xd9cbb0, 1.15);
    windowLight.position.set(4.5, 9, -4);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.width = 1024;
    windowLight.shadow.mapSize.height = 1024;
    scene.add(windowLight);

    const deskCandleLight = new THREE.PointLight(0xff9d3b, 28, 7.5, 1.6);
    deskCandleLight.position.set(-1.35, 1.25, 2.25);
    deskCandleLight.castShadow = true;
    scene.add(deskCandleLight);

    const centerSpot = new THREE.SpotLight(0xffcf7d, 40, 9, Math.PI / 4, 0.6, 1.2);
    centerSpot.position.set(0.2, 3.6, 2.6);
    centerSpot.target.position.set(0, 1.2, 2.0);
    scene.add(centerSpot);
    scene.add(centerSpot.target);

    const backLantern1 = new THREE.PointLight(0xe68a2e, 26, 12, 1.5);
    backLantern1.position.set(-3.4, 2.8, -4.5);
    scene.add(backLantern1);
    const backLantern2 = new THREE.PointLight(0xe68a2e, 26, 12, 1.5);
    backLantern2.position.set(3.4, 2.8, -6.5);
    scene.add(backLantern2);

    // Key light for the hero grimoire
    const bookKeyLight = new THREE.DirectionalLight(0xfff1d6, 1.3);
    bookKeyLight.position.set(-2.5, 4.5, 6.5);
    scene.add(bookKeyLight);
    const bookRimLight = new THREE.DirectionalLight(0xffb454, 0.9);
    bookRimLight.position.set(4.2, 2.8, -1.5);
    scene.add(bookRimLight);

    /* --------------------------- architecture --------------------------- */
    const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(28, 34)), darkWalnutMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    floor.receiveShadow = true;
    scene.add(floor);

    const backWall = new THREE.Mesh(track(new THREE.PlaneGeometry(28, 16)), stoneMat);
    backWall.position.set(0, 6, -15);
    scene.add(backWall);

    const pillarGeo = track(new THREE.BoxGeometry(0.75, 9, 0.75));
    const capGeo = track(new THREE.BoxGeometry(1.0, 0.35, 1.0));
    const beamGeo = track(new THREE.BoxGeometry(10.2, 0.42, 0.48));
    for (let z = -12; z <= 1; z += 4.2) {
      [-4.6, 4.6].forEach((x) => {
        const pillar = new THREE.Mesh(pillarGeo, stoneMat);
        pillar.position.set(x, 3.5, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);
        const cap = new THREE.Mesh(capGeo, stoneMat);
        cap.position.set(x, 5.8, z);
        scene.add(cap);
      });
      const beam = new THREE.Mesh(beamGeo, darkWalnutMat);
      beam.position.set(0, 6.2, z);
      scene.add(beam);
    }

    /* --------------------------- bookshelves ---------------------------- */
    const bookColors = [0x4a1e16, 0x2b3a2e, 0x5c3818, 0x1f2838, 0x69291d, 0x3b281c, 0x765139];
    const bookMats = bookColors.map((hex) =>
      track(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.75, metalness: 0.05 })),
    );
    const shelfRand = makePRNG(777001);

    function buildBookshelf(x: number, y: number, z: number, rotY: number, width = 3.2, height = 5.4, shelves = 6) {
      const shelfGroup = new THREE.Group();
      shelfGroup.position.set(x, y, z);
      shelfGroup.rotation.y = rotY;

      const back = new THREE.Mesh(track(new THREE.BoxGeometry(width, height, 0.15)), darkWalnutMat);
      back.position.z = -0.25;
      shelfGroup.add(back);
      const sideGeo = track(new THREE.BoxGeometry(0.16, height, 0.6));
      const leftSide = new THREE.Mesh(sideGeo, walnutMat);
      leftSide.position.x = -width / 2;
      shelfGroup.add(leftSide);
      const rightSide = new THREE.Mesh(sideGeo, walnutMat);
      rightSide.position.x = width / 2;
      shelfGroup.add(rightSide);
      const crown = new THREE.Mesh(track(new THREE.BoxGeometry(width + 0.3, 0.25, 0.75)), walnutMat);
      crown.position.y = height / 2 + 0.1;
      shelfGroup.add(crown);

      const plankGeo = track(new THREE.BoxGeometry(width, 0.1, 0.58));
      const stepY = (height - 0.6) / shelves;
      for (let s = 0; s <= shelves; s++) {
        const sy = -height / 2 + 0.3 + s * stepY;
        const plank = new THREE.Mesh(plankGeo, walnutMat);
        plank.position.y = sy;
        shelfGroup.add(plank);

        if (s < shelves) {
          let cursorX = -width / 2 + 0.22;
          while (cursorX < width / 2 - 0.25) {
            if (shelfRand() < 0.12) {
              cursorX += 0.18;
              continue;
            }
            const bw = 0.07 + shelfRand() * 0.08;
            const bh = stepY * (0.62 + shelfRand() * 0.26);
            const bd = 0.34 + shelfRand() * 0.1;
            const mat = bookMats[Math.floor(shelfRand() * bookMats.length)];
            const book = new THREE.Mesh(track(new THREE.BoxGeometry(bw, bh, bd)), mat);
            book.position.set(cursorX + bw / 2, sy + 0.05 + bh / 2, 0.02);
            book.rotation.z = (shelfRand() - 0.5) * 0.05;
            shelfGroup.add(book);
            if (shelfRand() > 0.55) {
              const band = new THREE.Mesh(
                track(new THREE.BoxGeometry(bw + 0.006, 0.025, bd + 0.006)),
                antiqueGoldMat,
              );
              band.position.set(book.position.x, book.position.y + bh * 0.25, 0.02);
              shelfGroup.add(band);
            }
            cursorX += bw + 0.015;
          }
        }
      }
      scene.add(shelfGroup);
    }

    buildBookshelf(-3.7, 1.9, -1.5, Math.PI / 2.4, 3.4, 5.4, 6);
    buildBookshelf(-3.9, 1.9, -5.6, Math.PI / 2.2, 3.4, 5.4, 6);
    buildBookshelf(3.9, 1.9, -2.2, -Math.PI / 2.3, 3.4, 5.4, 6);
    buildBookshelf(3.8, 1.9, -6.5, -Math.PI / 2.1, 3.4, 5.4, 6);
    buildBookshelf(-2.2, 1.9, -11.5, 0.12, 3.6, 5.6, 6);
    buildBookshelf(2.1, 1.9, -12.2, -0.1, 3.6, 5.6, 6);
    buildBookshelf(0, 2.2, -14.2, 0, 4.2, 6.0, 6);

    /* ----------------------- cathedral god rays ------------------------- */
    const godRays: THREE.Mesh[] = [];
    const rayMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xe8d5a7,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    for (let i = 0; i < 3; i++) {
      const rayMesh = new THREE.Mesh(track(new THREE.ConeGeometry(1.8 + i * 0.4, 11, 24, 1, true)), rayMat.clone());
      track(rayMesh.material as THREE.Material);
      rayMesh.position.set(1.6 + i * 0.8, 4.2, -4.5 - i * 2.2);
      rayMesh.rotation.z = 0.42;
      rayMesh.rotation.x = 0.15;
      scene.add(rayMesh);
      godRays.push(rayMesh);
    }

    /* ------------------------------ desk -------------------------------- */
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, 2.15);
    scene.add(deskGroup);

    const deskTop = new THREE.Mesh(track(new THREE.BoxGeometry(5.8, 0.16, 1.85)), walnutMat);
    deskTop.position.set(0, 0.72, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    const frontTrim = new THREE.Mesh(track(new THREE.BoxGeometry(5.92, 0.09, 0.08)), darkWalnutMat);
    frontTrim.position.set(0, 0.71, 0.94);
    deskGroup.add(frontTrim);

    const deskBody = new THREE.Mesh(track(new THREE.BoxGeometry(5.3, 1.4, 1.55)), darkWalnutMat);
    deskBody.position.set(0, -0.05, -0.05);
    deskGroup.add(deskBody);

    const drawerGeo = track(new THREE.BoxGeometry(1.55, 0.34, 0.05));
    const handleGeo = track(new THREE.TorusGeometry(0.065, 0.014, 8, 20));
    [-1.75, 0, 1.75].forEach((dx) => {
      const drawerFace = new THREE.Mesh(drawerGeo, walnutMat);
      drawerFace.position.set(dx, 0.42, 0.74);
      deskGroup.add(drawerFace);
      const handle = new THREE.Mesh(handleGeo, antiqueGoldMat);
      handle.position.set(dx, 0.42, 0.78);
      deskGroup.add(handle);
    });

    // Candle + flame
    const candleGroup = new THREE.Group();
    candleGroup.position.set(-1.35, 0.8, 0.05);
    deskGroup.add(candleGroup);
    const brassDish = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.2, 0.03, 24)), antiqueGoldMat);
    candleGroup.add(brassDish);
    const waxMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf5e8c8,
        roughness: 0.35,
        emissive: 0x3b1f06,
        emissiveIntensity: 0.35,
      }),
    );
    const candleBody = new THREE.Mesh(track(new THREE.CylinderGeometry(0.055, 0.062, 0.32, 20)), waxMat);
    candleBody.position.y = 0.17;
    candleGroup.add(candleBody);
    const candleFlameMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.028, 12, 12)),
      track(new THREE.MeshBasicMaterial({ color: 0xffd275 })),
    );
    candleFlameMesh.scale.set(0.7, 1.65, 0.7);
    candleFlameMesh.position.y = 0.37;
    candleGroup.add(candleFlameMesh);

    // Stacked books + inkwell (left), astrolabe (right)
    const leftBook1 = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.09, 0.42)), bookMats[0]);
    leftBook1.position.set(-1.78, 0.845, -0.05);
    leftBook1.rotation.y = 0.22;
    deskGroup.add(leftBook1);
    const leftBook2 = new THREE.Mesh(track(new THREE.BoxGeometry(0.48, 0.08, 0.38)), bookMats[2]);
    leftBook2.position.set(-1.76, 0.93, -0.04);
    leftBook2.rotation.y = -0.15;
    deskGroup.add(leftBook2);
    const inkwell = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.07, 0.09, 16)), antiqueGoldMat);
    inkwell.position.set(-1.65, 0.845, 0.32);
    deskGroup.add(inkwell);

    const astrolabeGroup = new THREE.Group();
    astrolabeGroup.position.set(1.62, 0.8, -0.1);
    deskGroup.add(astrolabeGroup);
    const astroBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.14, 0.18, 0.04, 24)), antiqueGoldMat);
    astrolabeGroup.add(astroBase);
    const astroStem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 12)), antiqueGoldMat);
    astroStem.position.y = 0.12;
    astrolabeGroup.add(astroStem);
    const astroOuterRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.18, 0.015, 12, 32)), antiqueGoldMat);
    astroOuterRing.position.y = 0.28;
    astroOuterRing.rotation.y = 0.4;
    astrolabeGroup.add(astroOuterRing);
    const astroInnerRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.13, 0.012, 12, 32)), antiqueGoldMat);
    astroInnerRing.position.y = 0.28;
    astroInnerRing.rotation.x = 0.65;
    astrolabeGroup.add(astroInnerRing);

    /* --------------------- hero grimoire (the tome) ---------------------- */
    const BOOK_SCALE = 0.3;
    const HERO_POS = new THREE.Vector3(0, 1.72, 1.78);
    const HERO_ROT = { x: 0.08, y: 0.34, z: -0.02 };

    const bookRoot = new THREE.Group();
    bookRoot.position.copy(HERO_POS);
    bookRoot.scale.setScalar(BOOK_SCALE);
    bookRoot.rotation.set(HERO_ROT.x, HERO_ROT.y, HERO_ROT.z);
    scene.add(bookRoot);

    const bookW = 3.15;
    const bookH = 4.25;
    const boardThick = 0.14;
    const pageBlockW = 2.94;
    const pageBlockH = 3.98;
    const pageBlockThick = 0.76;
    const totalThick = pageBlockThick + boardThick * 2;

    const coverMaps = createBookCoverTextures({
      withText: true,
      title: titleRef.current.title,
      subtitle: titleRef.current.subtitle,
    });
    track(coverMaps.diffuseTex);
    track(coverMaps.bumpTex);
    track(coverMaps.roughTex);
    const plainMaps = createBookCoverTextures({ withText: false, title: "", subtitle: "" });
    track(plainMaps.diffuseTex);
    track(plainMaps.bumpTex);
    track(plainMaps.roughTex);
    const pageTextures = createPageEdgeTextures();
    track(pageTextures.map);
    track(pageTextures.bumpMap);
    const metalBump = track(createMetalFiligreeBump());

    const coverMaterial = track(
      new THREE.MeshStandardMaterial({
        map: coverMaps.diffuseTex,
        bumpMap: coverMaps.bumpTex,
        bumpScale: 0.032,
        roughnessMap: coverMaps.roughTex,
        roughness: 0.72,
        metalness: 0.28,
      }),
    );
    const backCoverMaterial = track(
      new THREE.MeshStandardMaterial({
        map: plainMaps.diffuseTex,
        bumpMap: plainMaps.bumpTex,
        bumpScale: 0.028,
        roughnessMap: plainMaps.roughTex,
        roughness: 0.78,
        metalness: 0.22,
      }),
    );
    const spineMaterial = track(
      new THREE.MeshStandardMaterial({
        color: 0x24130a,
        bumpMap: plainMaps.bumpTex,
        bumpScale: 0.025,
        roughness: 0.68,
        metalness: 0.18,
      }),
    );
    const bookGoldMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xc9a24b,
        emissive: 0x1a1103,
        bumpMap: metalBump,
        bumpScale: 0.024,
        roughness: 0.34,
        metalness: 0.86,
      }),
    );
    const agedParchmentMat = track(
      new THREE.MeshStandardMaterial({
        map: pageTextures.map,
        bumpMap: pageTextures.bumpMap,
        bumpScale: 0.018,
        roughness: 0.88,
        metalness: 0.02,
      }),
    );
    const innerEndpaperMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xdfd0b0,
        bumpMap: pageTextures.bumpMap,
        bumpScale: 0.008,
        roughness: 0.9,
        metalness: 0.0,
      }),
    );
    const sideLeatherMat = track(
      new THREE.MeshStandardMaterial({ color: 0x22120a, roughness: 0.78, metalness: 0.15 }),
    );

    // Page block
    const pageBlockMesh = new THREE.Mesh(track(new THREE.BoxGeometry(pageBlockW, pageBlockH, pageBlockThick)), [
      agedParchmentMat,
      innerEndpaperMat,
      agedParchmentMat,
      agedParchmentMat,
      innerEndpaperMat,
      innerEndpaperMat,
    ]);
    pageBlockMesh.position.set(-0.04, 0, 0);
    pageBlockMesh.castShadow = true;
    bookRoot.add(pageBlockMesh);

    for (let i = 0; i < 14; i++) {
      const slipH = pageBlockH * (0.94 + (i % 3) * 0.02);
      const slip = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, slipH, 0.028)), agedParchmentMat);
      const zOff = -pageBlockThick * 0.44 + (i / 13) * (pageBlockThick * 0.88);
      slip.position.set(pageBlockW / 2 - 0.035 + Math.sin(i * 4.1) * 0.018, Math.cos(i * 2.3) * 0.02, zOff);
      bookRoot.add(slip);
    }

    // Corner bracket builder
    const cornerShape = new THREE.Shape();
    const armLen = 0.62;
    cornerShape.moveTo(0, 0);
    cornerShape.lineTo(armLen, 0);
    cornerShape.lineTo(armLen, 0.16);
    cornerShape.quadraticCurveTo(0.26, 0.26, 0.16, armLen);
    cornerShape.lineTo(0, armLen);
    cornerShape.closePath();
    const plateThick = 0.028;
    const wrapDepth = boardThick + plateThick * 1.6;
    const cornerGeo = track(
      new THREE.ExtrudeGeometry(cornerShape, {
        steps: 1,
        depth: wrapDepth,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
    );
    cornerGeo.translate(0, 0, -wrapDepth / 2);
    const bossGeo = track(new THREE.SphereGeometry(0.036, 12, 12));

    function addCornerBrackets(parentBoard: THREE.Mesh, isFront: boolean) {
      const corners = [
        { x: -bookW / 2 - 0.01, y: bookH / 2 + 0.01, rotZ: -Math.PI / 2 },
        { x: bookW / 2 + 0.01, y: bookH / 2 + 0.01, rotZ: Math.PI },
        { x: -bookW / 2 - 0.01, y: -bookH / 2 - 0.01, rotZ: 0 },
        { x: bookW / 2 + 0.01, y: -bookH / 2 - 0.01, rotZ: Math.PI / 2 },
      ];
      corners.forEach((c) => {
        const bracket = new THREE.Mesh(cornerGeo, bookGoldMat);
        bracket.position.set(c.x, c.y, 0);
        bracket.rotation.z = c.rotZ;
        bracket.castShadow = true;
        parentBoard.add(bracket);
        if (isFront) {
          const boss = new THREE.Mesh(bossGeo, bookGoldMat);
          boss.scale.set(1, 1, 0.45);
          boss.position.set(0.16, 0.16, wrapDepth / 2 + 0.008);
          bracket.add(boss);
        }
      });
    }

    // Back board
    const boardGeo = track(new THREE.BoxGeometry(bookW, bookH, boardThick));
    const backBoard = new THREE.Mesh(boardGeo, backCoverMaterial);
    backBoard.position.set(0, 0, -totalThick / 2 + boardThick / 2);
    backBoard.castShadow = true;
    bookRoot.add(backBoard);
    addCornerBrackets(backBoard, false);

    // Rounded spine with raised ribs + gold bands
    const spineGroup = new THREE.Group();
    spineGroup.position.set(-bookW / 2, 0, 0);
    bookRoot.add(spineGroup);
    const spineRadius = totalThick / 2;
    const spineMesh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(spineRadius, spineRadius, bookH + 0.02, 32, 1, false, Math.PI * 0.5, Math.PI)),
      spineMaterial,
    );
    spineMesh.castShadow = true;
    spineGroup.add(spineMesh);

    const hubGeo = track(new THREE.TorusGeometry(spineRadius + 0.012, 0.042, 14, 36, Math.PI));
    const goldBandGeo = track(new THREE.TorusGeometry(spineRadius + 0.008, 0.014, 10, 36, Math.PI));
    [-1.52, -0.76, 0, 0.76, 1.52].forEach((ry) => {
      const hubMesh = new THREE.Mesh(hubGeo, spineMaterial);
      hubMesh.rotation.x = Math.PI / 2;
      hubMesh.rotation.z = Math.PI / 2;
      hubMesh.position.set(0, ry, 0);
      spineGroup.add(hubMesh);
      [-0.055, 0.055].forEach((offset) => {
        const goldBand = new THREE.Mesh(goldBandGeo, bookGoldMat);
        goldBand.rotation.x = Math.PI / 2;
        goldBand.rotation.z = Math.PI / 2;
        goldBand.position.set(0, ry + offset, 0);
        spineGroup.add(goldBand);
      });
    });
    const capBandGeo = track(new THREE.TorusGeometry(spineRadius + 0.01, 0.022, 12, 36, Math.PI));
    [-bookH / 2 + 0.14, bookH / 2 - 0.14].forEach((capY) => {
      const capBand = new THREE.Mesh(capBandGeo, bookGoldMat);
      capBand.rotation.x = Math.PI / 2;
      capBand.rotation.z = Math.PI / 2;
      capBand.position.set(0, capY, 0);
      spineGroup.add(capBand);
    });

    // Hinged front cover
    const frontCoverPivot = new THREE.Group();
    frontCoverPivot.position.set(-bookW / 2, 0, totalThick / 2 - boardThick / 2);
    bookRoot.add(frontCoverPivot);
    const frontBoard = new THREE.Mesh(boardGeo, [
      sideLeatherMat,
      sideLeatherMat,
      sideLeatherMat,
      sideLeatherMat,
      coverMaterial,
      innerEndpaperMat,
    ]);
    frontBoard.position.set(bookW / 2, 0, 0);
    frontBoard.castShadow = true;
    frontCoverPivot.add(frontBoard);
    addCornerBrackets(frontBoard, true);

    const emblemRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.41, 0.016, 14, 48)), bookGoldMat);
    emblemRing.position.set(0, 0, boardThick / 2 + 0.008);
    frontBoard.add(emblemRing);

    const starGem = new THREE.Mesh(
      track(new THREE.OctahedronGeometry(0.055, 0)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0xffe49e,
          emissive: 0xffb838,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.8,
        }),
      ),
    );
    starGem.scale.set(1, 1.35, 0.35);
    starGem.position.set(0, 0.145, boardThick / 2 + 0.014);
    frontBoard.add(starGem);

    // Warm glint light near the cover
    const bookGlintLight = new THREE.PointLight(0xffcf70, 10, 6);
    bookGlintLight.position.set(0.3, 1.9, 2.6);
    scene.add(bookGlintLight);

    bookRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) child.userData.interactive = true;
    });

    // Re-tool the cover text once web fonts are loaded (Cinzel via next/font)
    let fontRefreshDone = false;
    document.fonts?.ready.then(() => {
      if (fontRefreshDone || disposed) return;
      fontRefreshDone = true;
      const fresh = createBookCoverTextures({
        withText: true,
        title: titleRef.current.title,
        subtitle: titleRef.current.subtitle,
      });
      coverMaterial.map?.dispose();
      coverMaterial.bumpMap?.dispose();
      coverMaterial.roughnessMap?.dispose();
      coverMaterial.map = fresh.diffuseTex;
      coverMaterial.bumpMap = fresh.bumpTex;
      coverMaterial.roughnessMap = fresh.roughTex;
      coverMaterial.needsUpdate = true;
      track(fresh.diffuseTex);
      track(fresh.bumpTex);
      track(fresh.roughTex);
    });

    /* --------------------------- dust motes ------------------------------ */
    const particleCount = 340;
    const particleGeo = track(new THREE.BufferGeometry());
    const positions = new Float32Array(particleCount * 3);
    const dustVelocities: { x: number; y: number; z: number; phase: number }[] = [];
    const dustRand = makePRNG(246802);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (dustRand() - 0.5) * 11;
      positions[i * 3 + 1] = dustRand() * 6.5 - 0.5;
      positions[i * 3 + 2] = (dustRand() - 0.5) * 16 - 3;
      dustVelocities.push({
        x: (dustRand() - 0.5) * 0.004,
        y: 0.002 + dustRand() * 0.005,
        z: (dustRand() - 0.5) * 0.004,
        phase: dustRand() * Math.PI * 2,
      });
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = track(
      new THREE.PointsMaterial({
        size: 0.095,
        map: track(createParticleTexture()),
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dustParticles);

    /* --------------------------- interaction ----------------------------- */
    let targetCamX = 0;
    let targetCamY = 1.65;
    let isDragging = false;
    let dragDistance = 0;
    let prevPointer = { x: 0, y: 0 };
    const targetRot = { ...HERO_ROT };
    const currentRot = { ...HERO_ROT };
    const mouseParallax = { x: 0, y: 0 };
    let currentCoverAngle = 0;
    let hoveringBook = false;

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.x = nx;
      mouse.y = ny;
      mouseParallax.x = -ny * 0.05;
      mouseParallax.y = nx * 0.07;
      targetCamX = nx * 0.3;
      targetCamY = 1.65 + ny * 0.16;

      if (isDragging) {
        const dx = e.clientX - prevPointer.x;
        const dy = e.clientY - prevPointer.y;
        dragDistance += Math.hypot(dx, dy);
        targetRot.y += dx * 0.0075;
        targetRot.x = Math.max(-0.7, Math.min(0.7, targetRot.x + dy * 0.0065));
        prevPointer = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement) !== renderer.domElement) return;
      isDragging = true;
      dragDistance = 0;
      prevPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (isDragging && dragDistance < 6 && hoveringBook && !bookOpenRef.current) {
        onBookClickRef.current();
      }
      isDragging = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    /* --------------------------- animation ------------------------------- */
    const timer = new THREE.Timer();
    let rafId = 0;
    let disposed = false;

    const animate = (timestamp?: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const elapsed = timer.getElapsed();

      // Camera parallax
      camera.position.x += (targetCamX - camera.position.x) * 0.045;
      camera.position.y += (targetCamY - camera.position.y) * 0.045;
      camera.lookAt(camera.position.x * 0.25, 1.35, -0.4);

      // Candle flicker
      const flicker = Math.sin(elapsed * 14) * 0.08 + Math.cos(elapsed * 23) * 0.05;
      deskCandleLight.intensity = 28 + flicker * 24;
      candleFlameMesh.scale.set(0.7 + flicker * 0.35, 1.65 + flicker * 0.8, 0.7 + flicker * 0.35);

      // Hero grimoire: breathing levitation + rotation damping
      const open = bookOpenRef.current;
      const desiredX = (open ? 0.04 : targetRot.x) + mouseParallax.x + Math.sin(elapsed * 0.9) * 0.012;
      const desiredY = (open ? 0.12 : targetRot.y) + mouseParallax.y + Math.cos(elapsed * 0.7) * 0.015;
      const desiredZ = open ? 0 : targetRot.z;
      currentRot.x += (desiredX - currentRot.x) * 0.08;
      currentRot.y += (desiredY - currentRot.y) * 0.08;
      currentRot.z += (desiredZ - currentRot.z) * 0.08;
      bookRoot.rotation.set(currentRot.x, currentRot.y, currentRot.z);
      bookRoot.position.y = HERO_POS.y + Math.sin(elapsed * 1.1) * 0.035;

      // Cover hinge
      const targetCoverAngle = open ? -Math.PI * 0.72 : 0;
      currentCoverAngle += (targetCoverAngle - currentCoverAngle) * 0.09;
      frontCoverPivot.rotation.y = currentCoverAngle;

      // Star gem shimmer
      bookGlintLight.position.x = 0.25 + Math.sin(elapsed * 1.8) * 0.15;
      bookGlintLight.intensity = 10 + Math.sin(elapsed * 3.1) * 3;

      // Astrolabe slow spin
      astrolabeGroup.rotation.y = elapsed * 0.25;

      // Dust drift
      const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const vel = dustVelocities[i];
        let x = posAttr.getX(i) + vel.x + Math.sin(elapsed + vel.phase) * 0.0012;
        let y = posAttr.getY(i) + vel.y;
        const z = posAttr.getZ(i) + vel.z;
        if (y > 6.2) y = -0.4;
        if (x > 5.5) x = -5.5;
        if (x < -5.5) x = 5.5;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      // God ray breathing
      godRays.forEach((ray, idx) => {
        (ray.material as THREE.MeshBasicMaterial).opacity = 0.038 + Math.sin(elapsed * 0.8 + idx) * 0.012;
      });

      // Hover detection on the grimoire
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(bookRoot, true);
      hoveringBook = hits.length > 0;
      renderer.domElement.style.cursor = hoveringBook && !open ? "pointer" : isDragging ? "grabbing" : "grab";

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // The scene mounts once; live values (bookOpen, callbacks, text) flow in
    // through refs so React updates never rebuild the WebGL world.
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        // Fallback backdrop while WebGL boots (or when it is unavailable)
        background:
          "radial-gradient(circle at 50% 45%, rgba(68, 43, 24, 0.42) 0%, rgba(20, 13, 9, 0.92) 55%, #080504 100%)",
      }}
    />
  );
}
