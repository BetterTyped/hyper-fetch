import { Animation } from "./animation.types";

export const glowAnimation: Animation = ({ timeline, index }) => {
  const halo = `#halo${index}`;
  const gradient = `#gradient${index}`;

  // Halo
  timeline.from(
    halo,
    {
      opacity: 0,
      scale: 0,
    },
    0,
  );
  timeline.to(
    halo,
    {
      opacity: 1,
      scale: 1,
    },
    1,
  );
  timeline.to(
    halo,
    {
      opacity: 1,
      scale: 1,
    },
    8,
  );
  timeline.to(
    halo,
    {
      opacity: 0,
      scale: 0,
    },
    9.7,
  );
  // Gradient
  timeline.from(
    gradient,
    {
      opacity: 0,
      scale: 0,
    },
    0,
  );
  timeline.to(
    gradient,
    {
      opacity: 1,
      scale: 1,
    },
    1,
  );
  timeline.to(
    gradient,
    {
      opacity: 1,
      scale: 1,
    },
    8,
  );
  timeline.to(
    gradient,
    {
      opacity: 0,
      scale: 0,
    },
    9.7,
  );
};
