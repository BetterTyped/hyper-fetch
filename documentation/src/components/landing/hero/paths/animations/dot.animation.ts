import { Animation } from "./animation.types";

export const dotAnimation: Animation = ({ dot, timeline, pathIndex }) => {
  // High pathIndex = top of screen (shorter paths), low pathIndex = bottom (longer paths)
  const t = 1 - (pathIndex - 1) / 31;
  const appearAt = 0.8 + t * 0.4;
  const fadeOutAt = 5.4 + t * 1.6;

  timeline.set(dot, { autoAlpha: 0, scale: 0 }, 0);
  timeline.to(dot, { autoAlpha: 1, scale: 1, duration: 0.6 }, appearAt);
  timeline.to(dot, { autoAlpha: 0, scale: 0, duration: 0.6 }, fadeOutAt);
};
