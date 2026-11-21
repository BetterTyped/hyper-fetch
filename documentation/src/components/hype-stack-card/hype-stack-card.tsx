import React from "react";

import "./hype-stack-card.css";

/*
 * The card that sends a reader on to Hype Stack, the full stack template made by the same people. It is always one
 * line: a small label, the headline and an orange arrow. Beside a docs page it sits in the right column, above the
 * sponsors. On every page without that column, and on a screen too narrow to show it, it sits in the corner of the
 * window.
 */

type Campaign = "docs-sidebar" | "docs-float";

const link = (campaign: Campaign) =>
  `https://www.hype-stack.dev/?ref=hyper-fetch&utm_source=hyper-fetch&utm_medium=referral&utm_campaign=${campaign}`;

const NAME = "Build your SaaS on Hype Stack";

function Card({ campaign }: { campaign: Campaign }) {
  return (
    <a
      className="hs-ad"
      href={link(campaign)}
      target="_blank"
      rel="noopener"
      aria-label={NAME}
    >
      <span className="hs-ad-label">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
        From Hype Stack
      </span>
      <strong>
        Build your SaaS on <b>Hype Stack</b>
      </strong>
      <span className="hs-ad-go" aria-hidden>
        <svg viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );
}

/** The card in the right column of a docs page, above the sponsors. */
export function HypeStackCard() {
  return (
    <div className="hs-ad-rail">
      <Card campaign="docs-sidebar" />
    </div>
  );
}

/** The same card pinned to the corner of the window, on pages without the right column. */
export function HypeStackFloat() {
  return (
    <aside className="hs-ad-float" aria-label="From Hype Stack">
      <Card campaign="docs-float" />
    </aside>
  );
}
