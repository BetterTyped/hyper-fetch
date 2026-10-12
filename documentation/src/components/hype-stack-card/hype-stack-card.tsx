import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

import "./hype-stack-card.css";

/*
 * The card that sends a reader on to Hype Stack, the full stack template made by the same people. Beside a docs
 * page it sits in the right column, above the sponsors. On every page without that column, and on a screen too
 * narrow to show it, it sits in the corner of the window.
 */

type Campaign = "docs-sidebar" | "docs-float";

const link = (campaign: Campaign) =>
  `https://www.hype-stack.dev/?ref=hyper-fetch&utm_source=hyper-fetch&utm_medium=referral&utm_campaign=${campaign}`;

const NAME = "Build your SaaS on Hype Stack";

/** Shrunk for this visit: the card stays small until the tab is closed, and comes back whole the next time. */
const SMALL = "hyper-fetch:docs:hype-card";

/** A phone has no room for the whole card, so there it is always the small one. */
const PHONE = "(max-width: 560px)";

/** Whether the reader shrank the card on this visit, and the way to shrink it. Null until the page runs. */
function useShrunk(): [boolean | null, () => void] {
  const [small, setSmall] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setSmall(window.sessionStorage.getItem(SMALL) !== null);
    } catch {
      // Blocked storage: the card shows whole, and shrinking it lasts for this page.
      setSmall(false);
    }
  }, []);
  const shrink = () => {
    setSmall(true);
    try {
      window.sessionStorage.setItem(SMALL, "1");
    } catch {
      // Blocked storage: small for this page only.
    }
  };
  return [small, shrink];
}

function Card({
  campaign,
  small,
  text,
}: {
  campaign: Campaign;
  small: boolean;
  text: boolean;
}) {
  const picture = useBaseUrl("/img/hype-stack-apps.jpg");
  return (
    <a
      className="hs-ad"
      data-small={small ? "" : undefined}
      href={link(campaign)}
      target="_blank"
      rel="noopener"
      aria-label={NAME}
    >
      <span className="hs-ad-art" aria-hidden>
        <img src={picture} alt="" width={720} height={400} loading="lazy" />
      </span>
      <span className="hs-ad-label">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
        From Hype Stack
      </span>
      <strong>
        Build your SaaS on <b>Hype Stack</b>
      </strong>
      {text && (
        <span className="hs-ad-text">
          Free React and Hono template. One CLI command writes auth, billing and
          teams into your own repo.
        </span>
      )}
      <span className="hs-ad-price">
        <b>Free</b> MIT template
      </span>
      <span className="hs-ad-go">
        <span>Explore the stack</span>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );
}

function Cross({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="hs-ad-close"
      onClick={onClick}
      aria-label="Shrink the Hype Stack card"
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

/**
 * The card in the right column of a docs page, above the sponsors. Its cross does not take it away: it shrinks the
 * card to one line with the way in still on it.
 */
export function HypeStackCard() {
  const [small, shrink] = useShrunk();
  return (
    <div className="hs-ad-rail" data-small={small ? "" : undefined}>
      <Card campaign="docs-sidebar" small={Boolean(small)} text={false} />
      {small ? null : <Cross onClick={shrink} />}
    </div>
  );
}

/**
 * The same card pinned to the corner of the window. It is drawn only once the page runs, so someone who shrank it
 * never sees the whole card flash back.
 */
export function HypeStackFloat() {
  const [small, shrink] = useShrunk();
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const read = () => setPhone(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);
  if (small === null) return null;
  const compact = small || phone;
  return (
    <aside className="hs-ad-float" aria-label="From Hype Stack">
      <Card campaign="docs-float" small={compact} text />
      {compact ? null : <Cross onClick={shrink} />}
    </aside>
  );
}
