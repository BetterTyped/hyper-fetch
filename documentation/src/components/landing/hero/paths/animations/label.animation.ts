import { Animation } from "./animation.types";

export const labelAnimation: Animation = ({ label, timeline }) => {
  timeline.from(
    label,
    {
      opacity: 0,
    },
    0,
  );
  timeline.to(
    label,
    {
      opacity: 0,
    },
    5,
  );
  timeline.to(
    label,
    {
      opacity: 1,
    },
    7,
  );
  timeline.to(
    label,
    {
      opacity: 1,
    },
    7,
  );
  timeline.to(
    label,
    {
      opacity: 0,
    },
    9,
  );
};
