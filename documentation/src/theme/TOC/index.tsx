import React from "react";
import clsx from "clsx";
import TOCItems from "@theme/TOCItems";
import type { Props } from "@theme/TOC";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { modules } from "@site/src/modules";
import { PackageDetails } from "@site/src/components";
import { HypeStackCard } from "@site/src/components/hype-stack-card/hype-stack-card";

import styles from "./styles.module.css";

const LINK_CLASS_NAME = "table-of-contents__link toc-highlight";
const LINK_ACTIVE_CLASS_NAME = "table-of-contents__link--active";

const HeartIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002l-.345.666-.345-.666Z" />
  </svg>
);

// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-default-export
export default function TOC({ className, ...props }: Props): React.ReactNode {
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
          href="https://github.com/sponsors/prc5"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sponsorButton}
          style={{ color: "#fff", textDecoration: "none" }}
        >
          <HeartIcon />
          <span>Sponsor</span>
        </a>

        <h6 className="text-[16px] font-bold uppercase ml-[4px]">
          On this page
        </h6>
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

        <HypeStackCard />

        <div className={styles.sponsorsSection}>
          <a
            href="https://github.com/sponsors/prc5"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sponsorsImage}
          >
            {/* The image is a wide canvas with the logos in its middle third, so it is cropped to them and scaled up */}
            <img
              src="https://github.com/prc5/sponsors/blob/main/packages/all/sponsorkit/sponsors.png?raw=true"
              alt="Our Sponsors"
              width={1667}
              height={646}
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
