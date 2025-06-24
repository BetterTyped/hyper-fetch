import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Note";
import { GraduationCap } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconLearn(props: Props): ReactNode {
  return <GraduationCap {...props} className="!size-10" />;
}
