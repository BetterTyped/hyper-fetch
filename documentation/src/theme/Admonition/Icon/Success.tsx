import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Tip";
import { Medal } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconSuccess(props: Props): ReactNode {
  return <Medal {...props} />;
}
