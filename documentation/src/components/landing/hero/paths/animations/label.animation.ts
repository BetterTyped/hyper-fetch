import { Animation } from "./animation.types";

export const labelAnimation: Animation = ({ label, timeline, pathIndex }) => {
  // High pathIndex = top of screen (shorter paths), low pathIndex = bottom (longer paths)
  const t = 1 - (pathIndex - 1) / 31;
  const appearAt = 4.2 + t * 1.2;
  const disappearAt = 5.2 + t * 1.5;

  timeline.set(label, { autoAlpha: 0 }, 0);
  timeline.to(label, { autoAlpha: 1, duration: 0.5 }, appearAt);
  timeline.to(label, { autoAlpha: 0, duration: 0.5 }, disappearAt);
};
