import React from "react";
import clsx from "clsx";
import TOCItems from "@theme/TOCItems";
import type { Props } from "@theme/TOC";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { modules } from "@site/src/modules";
import { PackageDetails } from "@site/src/components";

import styles from "./styles.module.css";

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = "table-of-contents__link toc-highlight";
const LINK_ACTIVE_CLASS_NAME = "table-of-contents__link--active";

// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-default-export
export default function TOC({ className, ...props }: Props): JSX.Element {
  const { activeItem } = useSidebar();

  const color = activeItem?.section || modules[0];

  return (
    <div className={clsx("toc", styles.tocWrapper)}>
      {activeItem?.section?.isPackage && (
        <PackageDetails
          icon={activeItem.img}
          name={activeItem.name}
          pkg={`@hyper-fetch/${activeItem.section.package}`}
        />
      )}
      <div className={styles.tocContent}>
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
    </div>
  );
}
