import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Danger";
import { Flame } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconDanger(props: Props): ReactNode {
  return <Flame {...props} />;
}
