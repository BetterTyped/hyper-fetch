import React from "react";
import clsx from "clsx";
import TOCItems from "@theme/TOCItems";
import type { Props } from "@theme/TOC";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { modules } from "@site/src/modules";
import { PackageDetails } from "@site/src/components";

import styles from "./styles.module.css";

const LINK_CLASS_NAME = "table-of-contents__link toc-highlight";
const LINK_ACTIVE_CLASS_NAME = "table-of-contents__link--active";

const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002l-.345.666-.345-.666Z" />
  </svg>
);

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
        <a
          href="https://github.com/BetterTyped/hyper-fetch"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.starButton}
          style={{ color: "#1a1a1a", textDecoration: "none" }}
        >
          <GitHubIcon />
          <span>Give us a Star!</span>
        </a>
        <a
          href="https://github.com/sponsors/prc5"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sponsorButton}
          style={{ color: "#fff", textDecoration: "none" }}
        >
          <HeartIcon />
          <span>Sponsor</span>
        </a>

        <h6 className="text-[16px] font-bold uppercase ml-[4px]">On this page</h6>
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

        <div className={styles.sponsorsSection}>
          <a
            href="https://github.com/sponsors/prc5"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sponsorsImage}
          >
            <img
              src="https://github.com/prc5/sponsors/blob/main/packages/all/sponsorkit/sponsors.png?raw=true"
              alt="Our Sponsors"
              width={1667}
              height={646}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
