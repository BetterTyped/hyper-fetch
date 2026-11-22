import React from "react";

/* The BetterTyped gold as an SVG gradient, so icons with the `bt-gold-icon` class can stroke with it */
export const GoldGradient = () => (
  <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden focusable="false">
    <defs>
      <linearGradient id="bt-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe08a" />
        <stop offset="100%" stopColor="#f5a623" />
      </linearGradient>
    </defs>
  </svg>
);
