import { linearTiming, type TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { blurSlide } from "@remotion/transitions/blur-slide";
import { dreamyZoom } from "@remotion/transitions/dreamy-zoom";
import { fade } from "@remotion/transitions/fade";
import { linearBlur } from "@remotion/transitions/linear-blur";
import { pushCut } from "@remotion/transitions/push-cut";
import { zoomBlur } from "@remotion/transitions/zoom-blur";
import React from "react";
import { AbsoluteFill, getInputProps, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { BAR, downbeats, sceneFrames, TRANSITION, type TransitionName, type VideoCue } from "../cues";
import { Background, type PatternMask, type PatternType } from "./Background";
import { TitleWidth } from "./fit";
import { easeInOut } from "./motion";

/*
 * Plays the scenes of a video on the bar grid of its cue sheet. Each scene enters with its own shader transition,
 * motion blurred, during the beat before its downbeat. Inside a scene the camera keeps creeping in, so nothing on
 * screen is ever completely still.
 *
 * Each scene paints its own copy of the background. The shader transitions capture a scene into a canvas, and
 * glows or translucent fills over a transparent scene lose their alpha there; over an opaque backdrop they don't.
 * The backdrop gets the video's frame, so its pattern runs on across the cut.
 */

export type Scene = { id: string; node: React.ReactNode };

/* Each presentation has its own props type, so the map erases them */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentations: Record<TransitionName, () => TransitionPresentation<any>> = {
  blurSlideLeft: () => blurSlide({ direction: "from-right", blur: 40 }),
  blurSlideUp: () => blurSlide({ direction: "from-bottom", blur: 40 }),
  zoomBlur: () => zoomBlur({ rotation: 0 }),
  linearBlur: () => linearBlur({ intensity: 0.12 }),
  dreamyZoom: () => dreamyZoom({ rotation: 4, scale: 1.4 }),
  pushCut: () => pushCut({ flashColor: "#fbc646", flashOpacity: 0.18, flashFrames: 6 }),
  fade: () => fade(),
};

/* The slow push-in every scene gets, alternating its anchor so consecutive scenes drift differently */
const Camera: React.FC<{ index: number; id: string; children: React.ReactNode }> = ({ index, id, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  /* Push in from the centre so the frame grows evenly and nothing near an edge is pushed out of the safe area */
  const origins = ["50% 50%", "50% 50%", "50% 50%", "50% 50%"];
  return (
    <AbsoluteFill
      data-scene={id}
      style={{
        scale: String(
          interpolate(frame, [0, durationInFrames], [1, 1.02], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easeInOut,
          }),
        ),
        transformOrigin: origins[index % origins.length],
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export type Backdrop = { pattern: PatternType; mask?: PatternMask; glowX?: number };

const SceneBackdrop: React.FC<{ start: number; backdrop: Backdrop }> = ({ start, backdrop }) => {
  const frame = useCurrentFrame();
  return <Background {...backdrop} frame={frame + start} />;
};

/*
 * Audit mode (stills from the render script): scenes play as plain sequences with hard cuts. Shader transitions lay
 * each scene out in a zero-size capture box, which hides real geometry from the fit audit; mid-scene frames look
 * the same either way.
 */
export const isAudit = () => getInputProps().audit === true;

export const Timeline: React.FC<{ cue: VideoCue; scenes: Scene[]; backdrop: Backdrop }> = ({ cue, scenes, backdrop }) => {
  const sceneOf = (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    if (!scene) throw new Error(`Scene ${id} of ${cue.id} has no markup`);
    return scene;
  };
  if (isAudit()) {
    return (
      <>
        {cue.scenes.map((sceneCue, i) => {
          const start = downbeats(cue)[i] - (i === 0 ? 0 : TRANSITION);
          const length = sceneFrames(cue, i) + (i === cue.scenes.length - 1 ? BAR : 0);
          return (
            <Sequence key={sceneCue.id} name={sceneCue.id} from={start + (i === 0 ? 0 : TRANSITION)} durationInFrames={length - (i === 0 ? 0 : TRANSITION)}>
              <Sequence from={i === 0 ? 0 : -TRANSITION} layout="none">
                <SceneBackdrop start={start} backdrop={backdrop} />
                <Camera index={i} id={sceneCue.id}>
                  {sceneOf(sceneCue.id).node}
                </Camera>
              </Sequence>
            </Sequence>
          );
        })}
      </>
    );
  }
  return (
    <TransitionSeries>
      {cue.scenes.flatMap((sceneCue, i) => {
        const start = downbeats(cue)[i] - (i === 0 ? 0 : TRANSITION);
        const scene = sceneOf(sceneCue.id);
        const items: React.ReactNode[] = [];
        if (i > 0) {
          items.push(
            <TransitionSeries.Transition
              key={`${sceneCue.id}-in`}
              presentation={presentations[sceneCue.enter ?? "fade"]()}
              timing={linearTiming({ durationInFrames: TRANSITION, easing: easeInOut })}
              motionBlur={{ shutterAngle: 200, samples: 12 }}
            />,
          );
        }
        items.push(
          <TransitionSeries.Sequence key={sceneCue.id} name={sceneCue.id} durationInFrames={sceneFrames(cue, i) + (i === cue.scenes.length - 1 ? BAR : 0)}>
            <SceneBackdrop start={start} backdrop={backdrop} />
            <Camera index={i} id={sceneCue.id}>
              {scene.node}
            </Camera>
          </TransitionSeries.Sequence>,
        );
        return items;
      })}
    </TransitionSeries>
  );
};

/* Copy on the left, the visual on the right */
export const Split: React.FC<{ copy: React.ReactNode; visual: React.ReactNode; copyWidth?: number; gap?: number; visualScale?: number }> = ({
  copy,
  visual,
  copyWidth = 620,
  gap = 90,
  visualScale = 1,
}) => (
  <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: "0 120px", gap }}>
    <div style={{ width: copyWidth, flexShrink: 0, display: "flex", flexDirection: "column", gap: 22 }}>
      <TitleWidth.Provider value={copyWidth}>{copy}</TitleWidth.Provider>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, scale: String(visualScale) }}>{visual}</div>
  </AbsoluteFill>
);

/* Copy centred at the top, the visual under it */
export const Stack: React.FC<{ copy: React.ReactNode; visual: React.ReactNode; top?: number; gap?: number; visualScale?: number }> = ({
  copy,
  visual,
  top = 120,
  gap = 64,
  visualScale = 1,
}) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top, gap }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      <TitleWidth.Provider value={1640}>{copy}</TitleWidth.Provider>
    </div>
    <div style={{ display: "flex", justifyContent: "center", width: "100%", scale: String(visualScale), transformOrigin: "50% 0%" }}>{visual}</div>
  </AbsoluteFill>
);
