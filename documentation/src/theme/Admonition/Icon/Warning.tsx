import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Warning";
import { TriangleAlert } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconCaution(props: Props): ReactNode {
  return <TriangleAlert {...props} />;
}
