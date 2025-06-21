export type Animation = (options: {
  // IDS
  path: string;
  item: string;
  dot: string;
  glow: string;
  label: string;
  // Settings
  timeline: gsap.core.Timeline;
  delay: number;
  duration: number;
  // Other
  pathIndex: number;
  index: number;
}) => void;
