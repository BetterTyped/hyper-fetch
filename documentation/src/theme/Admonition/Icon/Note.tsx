import React, { type ReactNode } from "react";
import type { Props } from "@theme/Admonition/Icon/Note";
import { Book } from "lucide-react";

// eslint-disable-next-line import/no-default-export
export default function AdmonitionIconNote(props: Props): ReactNode {
  return <Book {...props} />;
}
