import { Animation } from "./animation.types";

export const dotAnimation: Animation = ({ dot, timeline }) => {
  timeline.from(
    dot,
    {
      opacity: 0,
      scale: 0,
    },
    0,
  );
  timeline.to(
    dot,
    {
      opacity: 1,
      scale: 1,
    },
    1,
  );
  timeline.to(
    dot,
    {
      opacity: 1,
      scale: 1,
    },
    5,
  );
  timeline.to(
    dot,
    {
      opacity: 1,
      scale: 1,
    },
    8.5,
  );
  timeline.to(
    dot,
    {
      opacity: 0,
      scale: 0,
    },
    9.5,
  );
};
