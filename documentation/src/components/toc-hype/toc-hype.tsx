import Link from "@docusaurus/Link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { HfBolt } from "../hf-bolt/hf-bolt";

import "./toc-hype.css";

/** The transports the tagline cycles through, the same list the brand's supporting line names */
const WORDS = [
  "anything.",
  "REST",
  "GraphQL",
  "tRPC",
  "oRPC",
  "Firebase",
  "WebSockets",
  "SSE",
];

/**
 * Sits above "On this page" where package pages show the package card, with the same size: the tagline, with the
 * thing it fetches cycling through the backends HyperFetch talks to. Opens the integrations overview.
 */
export const TocHype = () => {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) {
      return undefined;
    }
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % WORDS.length),
      2200,
    );
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <div className="toc-hype-wrapper mb-6">
      <Link
        to="/docs/integrations/getting-started"
        className="toc-hype"
        aria-label="Fetch anything. Type everything."
      >
        <span className="toc-hype__tile" aria-hidden>
          <HfBolt />
        </span>
        <span className="toc-hype__text" aria-hidden>
          <span className="toc-hype__line">
            Fetch{" "}
            <span className="toc-hype__word">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={WORDS[index]}
                  className="bt-gold-text"
                  initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {WORDS[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span className="toc-hype__sub">Type everything.</span>
        </span>
        <span className="toc-hype__arrow" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </span>
      </Link>
    </div>
  );
};
