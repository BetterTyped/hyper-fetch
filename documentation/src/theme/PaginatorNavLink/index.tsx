import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import type { Props } from "@theme/PaginatorNavLink";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { sections } from "@site/src/sections";
import { getDocName } from "@site/src/hooks/use-filtered-sidebar";

// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-default-export
export default function PaginatorNavLink(props: Props): JSX.Element {
  const { permalink, title, subLabel, isNext } = props;
  const { activeItem } = useSidebar();

  const section = activeItem?.section || sections[0];

  const item = getDocName({
    label: title,
    href: permalink,
  });

  return (
    <Link
      className={clsx(
        "pagination-nav__link",
        isNext ? "pagination-nav__link--next" : "pagination-nav__link--prev",
        section.text,
        section.textAction,
        section.textHover,
        section.borderHover,
      )}
      to={permalink}
    >
      {subLabel && <div className="pagination-nav__sublabel">{subLabel}</div>}
      <div className={clsx("pagination-nav__label")}>{item.label}</div>
    </Link>
  );
}
