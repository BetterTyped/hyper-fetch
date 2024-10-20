import React from "react";
import clsx from "clsx";
import TOCItems from "@theme/TOCItems";
import type { Props } from "@theme/TOC";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { sections } from "@site/src/sections";

import styles from "./styles.module.css";

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = "table-of-contents__link toc-highlight";
const LINK_ACTIVE_CLASS_NAME = "table-of-contents__link--active";

// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-default-export
export default function TOC({ className, ...props }: Props): JSX.Element {
  const { activeItem } = useSidebar();

  const color = activeItem?.section || sections[1];

  return (
    <div className={clsx("toc", styles.tocWrapper)}>
      <h6>On this page</h6>
      <div
        className={clsx(
          styles.tableOfContents,
          "thin-scrollbar",
          color.text,
          color.textAction,
          color.textHover,
          className,
        )}
      >
        <TOCItems {...props} linkClassName={LINK_CLASS_NAME} linkActiveClassName={LINK_ACTIVE_CLASS_NAME} />
      </div>
    </div>
  );
}
