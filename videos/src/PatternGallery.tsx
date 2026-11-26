import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { Background, type PatternType } from "./brand/Background";
import { body, color, HEIGHT, WIDTH } from "./brand/tokens";

/*
 * Every backdrop pattern side by side, for choosing which video gets which. Each tile is the real full-frame
 * Background, cropped 1:1 from its upper middle, with the video that uses it today. Not part of any launch video.
 */
const TILES: { pattern: PatternType; usedBy: string }[] = [
  { pattern: "flickering", usedBy: "HyperFetch 10, DB, Firebase" },
  { pattern: "interactive", usedBy: "Tooling" },
  { pattern: "crosses", usedBy: "Core and React (new)" },
  { pattern: "striped", usedBy: "Typed backends" },
  { pattern: "hexagon", usedBy: "Sockets" },
  { pattern: "dots", usedBy: "GraphQL" },
];

export const GALLERY_WIDTH = WIDTH;
export const GALLERY_HEIGHT = (HEIGHT / 2) * 3;

export const PatternGallery: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill style={{ backgroundColor: "#000", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "repeat(3, 1fr)" }}>
    {TILES.map((tile, i) => (
      <div key={tile.pattern} style={{ position: "relative", overflow: "hidden", outline: "1px solid #000" }}>
        {/* A 1:1 crop of the full frame, upper middle, where the glow meets the pattern: thin lines stay visible */}
        <div style={{ position: "absolute", left: -WIDTH / 4, top: -HEIGHT / 8, width: WIDTH, height: HEIGHT }}>
          <Background pattern={tile.pattern} patternOpacity={strength} />
        </div>
        <div style={{ position: "absolute", left: 24, bottom: 20, fontFamily: body, color: color.zinc50, fontSize: 26, fontWeight: 600 }}>
          {i + 1}. {tile.pattern}
          <span style={{ color: "#a1a1aa", fontWeight: 400, fontSize: 20, marginLeft: 12 }}>{tile.usedBy}</span>
        </div>
      </div>
    ))}
  </AbsoluteFill>
);

/* The same patterns one after another, full frame at the real video size, 5 s each: motion reads here, not in tiles */
export const REEL_SECONDS = 5;
export const REEL_LENGTH = TILES.length * REEL_SECONDS;
export const PatternReel: React.FC<{ strength: number }> = ({ strength }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = TILES[Math.min(TILES.length - 1, Math.floor(frame / (fps * REEL_SECONDS)))];
  return (
    <AbsoluteFill>
      <Background pattern={tile.pattern} patternOpacity={strength} />
      <div style={{ position: "absolute", left: 60, bottom: 50, fontFamily: body, color: color.zinc50, fontSize: 40, fontWeight: 600 }}>
        {tile.pattern}
        <span style={{ color: "#a1a1aa", fontWeight: 400, fontSize: 30, marginLeft: 16 }}>{tile.usedBy}</span>
      </div>
    </AbsoluteFill>
  );
};
