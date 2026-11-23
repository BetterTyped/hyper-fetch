import React from "react";
import clsx from "clsx";
import TOCItems from "@theme/TOCItems";
import type { Props } from "@theme/TOC";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { modules } from "@site/src/modules";
import { PackageDetails } from "@site/src/components";
import { SponsorRail } from "@site/src/components/sponsors/sponsor-rail";
import { TocHype } from "@site/src/components/toc-hype/toc-hype";
import { npmNameOf } from "@site/src/utils/npm-name";

import styles from "./styles.module.css";

const LINK_CLASS_NAME = "table-of-contents__link toc-highlight";
const LINK_ACTIVE_CLASS_NAME = "table-of-contents__link--active";

const HeartIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002l-.345.666-.345-.666Z" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-default-export
export default function TOC({ className, ...props }: Props): React.ReactNode {
  const { activeItem } = useSidebar();

  const color = activeItem?.section || modules[0];

  return (
    <div className={clsx("toc", styles.tocWrapper)}>
      {activeItem?.section?.isPackage ? (
        <PackageDetails
          icon={activeItem.img}
          name={activeItem.name}
          pkg={
            npmNameOf(activeItem.section) ??
            `@hyper-fetch/${activeItem.section.package}`
          }
        />
      ) : (
        <TocHype />
      )}
      <div className={styles.tocContent}>
        <a
          href="https://github.com/sponsors/prc5"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sponsorButton}
        >
          <span className={styles.sponsorHeart}>
            <HeartIcon />
          </span>
          <span className={styles.sponsorLabel}>
            <b>Sponsor</b> HyperFetch
          </span>
          <span className={styles.sponsorArrow}>
            <ArrowIcon />
          </span>
        </a>

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
          <TOCItems
            {...props}
            linkClassName={LINK_CLASS_NAME}
            linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
          />
        </div>

        <SponsorRail />
      </div>
    </div>
  );
}
