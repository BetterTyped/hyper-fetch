import React, { useEffect, type ReactNode } from "react";

import { HypeStackFloat } from "../../components/hype-stack-card/hype-stack-card";

/*
 * Marks `html[data-nav-scrolled]` once the page leaves the top. The navbar CSS draws its frosted pill from it, so
 * the bar stays where it is and only the glass fades in around it.
 */
const useNavScrolled = () => {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      root.toggleAttribute("data-nav-scrolled", window.scrollY > 10);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);
};

/** Wraps every page of the site, so the Hype Stack card can sit in the corner of the ones without a sidebar. */
// eslint-disable-next-line import/no-default-export
export default function Root({ children }: { children: ReactNode }): ReactNode {
  useNavScrolled();

  return (
    <>
      {children}
      <HypeStackFloat />
    </>
  );
}
