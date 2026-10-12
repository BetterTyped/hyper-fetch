import React, { type ReactNode } from "react";

import { HypeStackFloat } from "../../components/hype-stack-card/hype-stack-card";

/** Wraps every page of the site, so the Hype Stack card can sit in the corner of the ones without a sidebar. */
// eslint-disable-next-line import/no-default-export
export default function Root({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <HypeStackFloat />
    </>
  );
}
