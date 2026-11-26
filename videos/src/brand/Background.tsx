import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

import { seeded } from "./motion";
import { color, HEIGHT, WIDTH } from "./tokens";

/*
 * The backdrop every video shares, built like the blog post covers: the flat #1c1c1d page, one soft gold glow
 * from the top, the post's pattern at a whisper behind a fade, a few gold particles and the site's subtle grain.
 * It stays mounted for the whole video, so scene changes never flash the background.
 */

export type PatternType = "crosses" | "dots" | "hexagon" | "striped" | "flickering" | "interactive";
export type PatternMask = "radial" | "top" | "bottom" | "sides" | "left" | "right" | "rectangle" | "full";

const masks: Record<PatternMask, string | undefined> = {
  full: undefined,
  radial: "radial-gradient(ellipse 65% 60% at 50% 50%, black 20%, transparent 75%)",
  top: "linear-gradient(to bottom, transparent 0%, black 40%, black 100%)",
  bottom: "linear-gradient(to top, transparent 0%, black 40%, black 100%)",
  sides: "linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
  left: "linear-gradient(to right, transparent 0%, black 40%, black 100%)",
  right: "linear-gradient(to left, transparent 0%, black 40%, black 100%)",
  rectangle: "radial-gradient(ellipse 80% 75% at 50% 50%, black 45%, transparent 85%)",
};

/*
 * The line patterns (stripes, the lit grid) breathe on one slow cycle: the surface brightens and dims together over
 * BREATH seconds, the edges a little behind the center. The cell patterns (squares, dots, crosses) move with the
 * drifting waves further down instead.
 */
const BREATH = 8;
const breathAt = (frame: number) => 0.5 + 0.5 * Math.sin(((frame / 60) * Math.PI * 2) / BREATH);
/* The same breath at a point: up to a quarter cycle late at the corners */
const breathAtPoint = (frame: number, x: number, y: number) => {
  const distance = Math.hypot(x - WIDTH / 2, y - HEIGHT / 2) / Math.hypot(WIDTH / 2, HEIGHT / 2);
  return 0.5 + 0.5 * Math.sin(((frame / 60) * Math.PI * 2) / BREATH - distance * (Math.PI / 2));
};

const GridLayer: React.FC<{ frame: number; cell?: number; lit?: boolean }> = ({ frame, cell = 64, lit = false }) => {
  const cols = Math.ceil(WIDTH / cell) + 1;
  const rows = Math.ceil(HEIGHT / cell) + 1;
  const rand = useMemo(() => seeded(7), []);
  const cells = useMemo(
    () => Array.from({ length: 26 }, () => ({ x: Math.floor(rand() * cols), y: Math.floor(rand() * rows), phase: rand() })),
    [cols, rows, rand],
  );
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={`grid-${cell}`} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke="rgba(161,161,170,0.34)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${cell})`} opacity={0.75 + 0.25 * breathAt(frame)} />
      {lit &&
        cells.map((c) => {
          /* Each lit cell keeps its own brightness and rises and falls with the breath where it sits */
          const o = (0.08 + 0.1 * c.phase) * breathAtPoint(frame, c.x * cell, c.y * cell);
          return <rect key={`${c.x}-${c.y}`} x={c.x * cell + 1} y={c.y * cell + 1} width={cell - 1} height={cell - 1} fill={color.bolt} opacity={o} />;
        })}
    </svg>
  );
};

/* A dot lattice lit by the slow waves, never fully gone so the lattice stays readable */
const DotsLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const gap = 28;
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < Math.ceil(HEIGHT / gap); y += 1) {
    for (let x = 0; x < Math.ceil(WIDTH / gap); x += 1) {
      dots.push(<circle key={`${x}-${y}`} cx={x * gap + gap / 2} cy={y * gap + gap / 2} r={1.8} fill="#a1a1aa" opacity={0.2 + texture(x, y) * 0.12 + wave(x * gap, y * gap, frame) * 0.8} />);
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {dots}
    </svg>
  );
};

const HexagonLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const r = 44;
  const w = Math.sqrt(3) * r;
  const h = 1.5 * r;
  const hexes: React.ReactNode[] = [];
  for (let row = -1; row < HEIGHT / h + 1; row += 1) {
    for (let col = -1; col < WIDTH / w + 1; col += 1) {
      const cx = col * w + (row % 2 ? w / 2 : 0);
      const cy = row * h;
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      /* Each cell glides on its own; the brightest stretch of its cycle tints it faintly gold, so a few warm cells drift in and out */
      const warm = glow(col + 2, row + 2, frame) * 0.7;
      hexes.push(
        <polygon
          key={`${row}-${col}`}
          points={pts}
          fill={`rgba(251,198,70,${warm * 0.035})`}
          stroke={warm > 0 ? `rgba(251,198,70,${0.2 + warm * 0.18})` : `rgba(161,161,170,${0.26 + texture(col + 2, row + 2) * 0.08})`}
          strokeWidth={1}
        />,
      );
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {hexes}
    </svg>
  );
};

const StripedLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const size = 34;
  const shift = (frame * 0.04) % size;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity: 0.7 + 0.3 * breathAt(frame) }}>
      <defs>
        <pattern id="stripes" width={size} height={size} patternUnits="userSpaceOnUse" patternTransform={`rotate(45) translate(${shift} 0)`}>
          <line x1={0} y1={0} x2={0} y2={size} stroke="rgba(113,113,122,0.8)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#stripes)" />
    </svg>
  );
};

/* A fixed random number per cell and step */
const hash = (x: number, y: number, k: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return n - Math.floor(n);
};

/*
 * How the cell patterns (squares, dots, crosses, hexagons) move. Every cell has a faint fixed brightness, the texture,
 * and on top of it a slow glow of its own: each cell glides between random levels over SWAP frames (1.5 s) on its own
 * offset, and only the top of that range lights it, so at any moment a scattering of cells is rising or fading. A
 * glide across the whole range was invisible on video (a few levels of grey); a glow that rises out of the texture
 * reads as breathing. Deterministic per frame.
 */
const SWAP = 90;
const glide = (x: number, y: number, frame: number) => {
  const local = frame + hash(x, y, 1) * SWAP;
  const k = Math.floor(local / SWAP);
  const eased = (1 - Math.cos(((local % SWAP) / SWAP) * Math.PI)) / 2;
  const from = hash(x, y, 5 + k);
  return from + (hash(x, y, 6 + k) - from) * eased;
};
/* The texture (0 to 1, fixed) and the glow (0 to 1, moving) of a cell */
const texture = (x: number, y: number) => hash(x, y, 2);
const glow = (x: number, y: number, frame: number) => {
  const lit = Math.max(0, (glide(x, y, frame) - 0.55) / 0.45);
  return lit * lit;
};

/*
 * Waves of light for the squares, dots and crosses: smooth 3D value noise (x, y, time) over a coarse lattice, two
 * octaves, drifting slowly across the frame. Neighbouring cells always move together, so the grid shows soft bright
 * regions that roll, merge and fade, a breath moving across the surface, never single cells blinking. Pixel input,
 * 0 to 1 out. Deterministic per frame.
 */
const smooth = (t: number) => t * t * (3 - 2 * t);
const lattice = (x: number, y: number, z: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const noise3 = (x: number, y: number, z: number) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const fz = smooth(z - z0);
  const plane = (z: number) => {
    const a = lattice(x0, y0, z) + (lattice(x0 + 1, y0, z) - lattice(x0, y0, z)) * fx;
    const b = lattice(x0, y0 + 1, z) + (lattice(x0 + 1, y0 + 1, z) - lattice(x0, y0 + 1, z)) * fx;
    return a + (b - a) * fy;
  };
  const near = plane(z0);
  return near + (plane(z0 + 1) - near) * fz;
};
const WAVE_CELL = 260;
const wave = (px: number, py: number, frame: number) => {
  const t = frame / 60;
  /* The whole field drifts slowly to the right and down while it morphs */
  const x = (px - t * 70) / WAVE_CELL;
  const y = (py - t * 30) / WAVE_CELL;
  const v = noise3(x, y, t / 1.8) * 0.68 + noise3(x * 2.1 + 17, y * 2.1 + 9, t / 1.2) * 0.32;
  /* Only the crests light up: most of the surface rests, soft bright regions roll through */
  const crest = Math.min(1, Math.max(0, (v - 0.42) / 0.3));
  return smooth(crest);
};

/* The flickering grid of the original cut: 6px squares with their own grain, lit by the slow waves */
const FlickeringLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const size = 6;
  const step = 15;
  const squares: React.ReactNode[] = [];
  for (let y = 0; y < Math.ceil(HEIGHT / step); y += 1) {
    for (let x = 0; x < Math.ceil(WIDTH / step); x += 1) {
      squares.push(<rect key={`${x}-${y}`} x={x * step} y={y * step} width={size} height={size} fill="#a1a1aa" opacity={texture(x, y) * 0.14 + wave(x * step, y * step, frame) * (0.45 + 0.55 * texture(x, y))} />);
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {squares}
    </svg>
  );
};

/* Small plus marks on a 36px lattice, lit by the slow waves, never fully gone so the lattice stays readable */
const CrossesLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const step = 36;
  const arm = 4;
  const marks: React.ReactNode[] = [];
  for (let y = 0; y < Math.ceil(HEIGHT / step) + 1; y += 1) {
    for (let x = 0; x < Math.ceil(WIDTH / step) + 1; x += 1) {
      const cx = x * step + step / 2;
      const cy = y * step + step / 2;
      marks.push(
        <path
          key={`${x}-${y}`}
          d={`M ${cx - arm} ${cy} H ${cx + arm} M ${cx} ${cy - arm} V ${cy + arm}`}
          stroke="#a1a1aa"
          strokeWidth={1.3}
          strokeLinecap="round"
          opacity={0.16 + texture(x, y) * 0.12 + wave(cx, cy, frame) * 0.82}
        />,
      );
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {marks}
    </svg>
  );
};

const LAYERS: Record<PatternType, React.FC<{ frame: number }>> = {
  crosses: CrossesLayer,
  dots: DotsLayer,
  hexagon: HexagonLayer,
  striped: StripedLayer,
  flickering: FlickeringLayer,
  interactive: (p) => <GridLayer {...p} cell={60} lit />,
};

const Particles: React.FC<{ frame: number; count?: number }> = ({ frame, count = 34 }) => {
  const parts = useMemo(() => {
    const rand = seeded(42);
    return Array.from({ length: count }, () => ({
      x: rand() * WIDTH,
      y: rand() * HEIGHT,
      r: 0.8 + rand() * 1.6,
      speed: 0.03 + rand() * 0.09,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {parts.map((p) => {
        const y = (((p.y - frame * p.speed) % HEIGHT) + HEIGHT) % HEIGHT;
        const x = p.x + Math.sin(frame / 240 + p.phase) * 10;
        const o = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 150 + p.phase));
        return <circle key={`${p.x}-${p.y}`} cx={x} cy={y} r={p.r} fill={color.bolt} opacity={o} />;
      })}
    </svg>
  );
};

export const Background: React.FC<{
  pattern: PatternType;
  mask?: PatternMask;
  /* Moves the glow across the top, 0 is left and 1 is right */
  glowX?: number;
  patternOpacity?: number;
  /* The video's frame. Scenes pass it so the pattern runs on across cuts instead of restarting */
  frame?: number;
}> = ({ pattern, mask = "radial", glowX = 0.58, patternOpacity = 0.45, frame: frameProp }) => {
  const local = useCurrentFrame();
  const frame = frameProp ?? local;
  const Layer = LAYERS[pattern];
  const maskImage = masks[mask];
  const drift = Math.sin(frame / 600) * 50;
  const breathe = 0.92 + 0.08 * Math.sin(frame / 300);

  return (
    <AbsoluteFill style={{ backgroundColor: color.page, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -330,
          left: WIDTH * glowX + drift - 640,
          width: 1280,
          height: 660,
          borderRadius: "50%",
          background: "rgba(245,166,35,0.17)",
          filter: "blur(150px)",
          opacity: breathe,
        }}
      />
      <AbsoluteFill style={{ opacity: patternOpacity, maskImage, WebkitMaskImage: maskImage }}>
        <Layer frame={frame} />
      </AbsoluteFill>
      <Particles frame={frame} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("noise.webp")})`, backgroundRepeat: "repeat", opacity: 0.04 }} />
    </AbsoluteFill>
  );
};
