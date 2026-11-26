import React from "react";

import { Stack } from "../brand/Timeline";
import { Eyebrow, Title } from "../brand/ui";

/* A scene that is one chart: eyebrow, title, and the chart filling the frame under them */
export const ChartScene: React.FC<{ eyebrow: string; title: string; gold?: string[]; chart: React.ReactNode; scale?: number; top?: number }> = ({
  eyebrow,
  title,
  gold,
  chart,
  scale = 1,
  top = 120,
}) => (
  <Stack
    top={top}
    gap={70}
    visualScale={scale}
    copy={
      <>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title size={104} align="center" delay={4} gold={gold}>
          {title}
        </Title>
      </>
    }
    visual={chart}
  />
);
