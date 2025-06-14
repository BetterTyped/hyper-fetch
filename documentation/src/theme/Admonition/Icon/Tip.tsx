import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Tip";
import { Lightbulb } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconTip(props: Props): ReactNode {
  return <Lightbulb {...props} />;
}
