import React from "react";

/**
 * The HyperFetch bolt, inline, so it draws on the first paint with no request and no global `img` styles in the
 * way. Same path as `static/img/integration-hyper-fetch.svg`, cropped to the bolt.
 */
export const HfBolt = ({ className }: { className?: string }) => (
  <svg
    viewBox="79 35 134 230"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#fbc646"
      d="M118.65 35.43h85.21l-36.05 67.37h44.25L104.99 264.91l28.41-119.4H79.32l39.33-110.08Z"
    />
  </svg>
);
