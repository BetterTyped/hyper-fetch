import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Info";
import { Info } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconInfo(props: Props): ReactNode {
  return <Info {...props} />;
}
