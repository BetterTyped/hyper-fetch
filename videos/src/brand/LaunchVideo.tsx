import { lightLeak } from "@remotion/effects/light-leak";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, Sequence, Solid, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { BAR, BEAT, cues, downbeats, TRANSITION, totalFrames, type VideoCue } from "../cues";
import type { PatternMask, PatternType } from "./Background";
import { FitAudit } from "./FitAudit";
import { Sfx } from "./Sfx";
import { type Scene, Timeline } from "./Timeline";

export type VideoDefinition = {
  id: string;
  /* The blog post slug the video promotes */
  post: string;
  pattern: PatternType;
  mask?: PatternMask;
  glowX?: number;
  scenes: Scene[];
};

export const cueOf = (video: VideoDefinition): VideoCue => {
  const cue = cues[video.id];
  if (!cue) throw new Error(`No cue sheet for ${video.id}`);
  return cue;
};

export const videoLength = (video: VideoDefinition) => totalFrames(cueOf(video));

/* A warm gold light leak washing over a cut, screen blended so it only ever adds light */
const Leak: React.FC<{ seed: number; strength: number }> = ({ seed, strength }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: strength }}>
      <Solid
        width={width}
        height={height}
        effects={[
          lightLeak({
            seed,
            hueShift: 0,
            progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }),
        ]}
      />
    </AbsoluteFill>
  );
};

/* The music fades in over the first frames and out over the last bar */
const Music: React.FC<{ id: string; total: number }> = ({ id, total }) => (
  <Audio
    src={staticFile(`music/${id}.wav`)}
    volume={(f) => interpolate(f, [0, 6, total - BAR, total - 1], [0, 0.66, 0.66, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
);

export const LaunchVideo: React.FC<{ video: VideoDefinition }> = ({ video }) => {
  const cue = cueOf(video);
  const beats = downbeats(cue);
  const total = totalFrames(cue);
  return (
    <AbsoluteFill data-frame style={{ width: 1920, height: 1080, right: "auto", bottom: "auto" }}>
      <Timeline cue={cue} scenes={video.scenes} backdrop={{ pattern: video.pattern, mask: video.mask, glowX: video.glowX }} />

      {/* Every cut: a whoosh across the transition beat and a light leak; bigger moments get one twice as bright */}
      {beats.slice(1).map((at, i) => {
        const big = cue.scenes[i + 1].energy === "outro" || cue.scenes[i + 1].energy === "high";
        return (
          <React.Fragment key={at}>
            <Sfx at={at - TRANSITION} name="whoosh" volume={0.42} />
            <Sequence from={at - BEAT} durationInFrames={BEAT * 3} name="light leak">
              <Leak seed={i * 3 + 1} strength={big ? 0.24 : 0.15} />
            </Sequence>
          </React.Fragment>
        );
      })}

      <Music id={video.id} total={total} />
      <FitAudit video={video.id} />
    </AbsoluteFill>
  );
};
