import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

import "./hype-stack-card.css";

/*
 * The card that sends a reader on to Hype Stack, the full stack template made by the same people. It sits at the
 * bottom of the docs sidebar, and in the corner of the window on every page that has no sidebar.
 */

type Campaign = "docs-sidebar" | "docs-float";

const link = (campaign: Campaign) =>
  `https://www.hype-stack.dev/?ref=hyper-fetch&utm_source=hyper-fetch&utm_medium=referral&utm_campaign=${campaign}`;

const NAME = "Build your SaaS on Hype Stack";

function Pitch({ text }: { text: boolean }) {
  const picture = useBaseUrl("/img/hype-stack-apps.jpg");
  return (
    <>
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
        Explore the stack
        <i aria-hidden>›</i>
      </span>
    </>
  );
}

/** The card at the bottom of the docs sidebar. */
export function HypeStackCard() {
  return (
    <div className="hs-ad-dock">
      <a
        className="hs-ad"
        href={link("docs-sidebar")}
        target="_blank"
        rel="noopener"
        aria-label={NAME}
      >
        <Pitch text={false} />
      </a>
    </div>
  );
}

/** Closed for this visit: the card stays away until the tab is closed, and comes back the next time. */
const CLOSED = "hyper-fetch:docs:hype-card";

/**
 * The same card pinned to the corner of the window, for every page that has no sidebar to put it in. It can be
 * closed, and it is drawn only once the page runs, so someone who closed it never sees it flash back.
 */
export function HypeStackFloat() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    try {
      setShown(window.sessionStorage.getItem(CLOSED) === null);
    } catch {
      // Blocked storage: the card shows, and closing it lasts for this page.
      setShown(true);
    }
  }, []);
  if (!shown) return null;
  const close = () => {
    setShown(false);
    try {
      window.sessionStorage.setItem(CLOSED, "1");
    } catch {
      // Blocked storage: closed for this page only.
    }
  };
  return (
    <aside className="hs-ad-float" aria-label="From Hype Stack">
      <a
        className="hs-ad"
        href={link("docs-float")}
        target="_blank"
        rel="noopener"
        aria-label={NAME}
      >
        <Pitch text />
      </a>
      <button
        type="button"
        className="hs-ad-close"
        onClick={close}
        aria-label="Close the Hype Stack card"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
