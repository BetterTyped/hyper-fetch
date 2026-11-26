import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";

export type SfxName = "whoosh" | "impact" | "pop" | "tick" | "ding" | "error" | "riser" | "swish" | "type" | "boom" | "glitch" | "success";

/* A sound effect at a frame of the current sequence. The files are synthesized by scripts/score.mjs */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume = 1 }) => (
  <Sequence from={Math.round(at)} durationInFrames={240} layout="none" name={`sfx ${name}`}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

