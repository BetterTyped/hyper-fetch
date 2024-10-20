import React, { ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames } from "@docusaurus/theme-common";
import * as internal from "@docusaurus/theme-common/internal";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";
import { NavTabs } from "@site/src/components/nav-tabs/nav-tabs";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { sections } from "@site/src/sections";
import { getDocName } from "@site/src/hooks/use-filtered-sidebar";

function getLast<T>(array: T[]) {
  return array[array.length - 1];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function BreadcrumbsItemLink({
  children,
  href,
  isLast,
  className,
}: {
  children: ReactNode;
  href: string | undefined;
  isLast: boolean;
  className?: string;
}): JSX.Element {
  const classNames = clsx("breadcrumbs__link", className);
  if (isLast) {
    return (
      <span className={classNames} itemProp="name">
        {children}
      </span>
    );
  }
  return href ? (
    <Link className={classNames} href={href} itemProp="item">
      <span itemProp="name">{children}</span>
    </Link>
  ) : (
    // TODO Google search console doesn't like breadcrumb items without href.
    // The schema doesn't seem to require `id` for each `item`, although Google
    // insist to infer one, even if it's invalid. Removing `itemProp="item
    // name"` for now, since I don't know how to properly fix it.
    // See https://github.com/facebook/docusaurus/issues/7241
    <span className={classNames}>{children}</span>
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function BreadcrumbsItem({
  children,
  active,
  index,
  addMicrodata,
}: {
  children: ReactNode;
  active?: boolean;
  index: number;
  addMicrodata: boolean;
}): JSX.Element {
  return (
    <li
      {...(addMicrodata && {
        itemScope: true,
        itemProp: "itemListElement",
        itemType: "https://schema.org/ListItem",
      })}
      className={clsx("breadcrumbs__item", {
        "breadcrumbs__item--active": active,
      })}
    >
      {children}
      <meta itemProp="position" content={String(index + 1)} />
    </li>
  );
}

// eslint-disable-next-line import/no-default-export, @typescript-eslint/naming-convention
export default function DocBreadcrumbs(): JSX.Element | null {
  return null;
  // const breadcrumbs = useSidebarBreadcrumbs();
  // const location = useLocation();
  // const data = useGlobalData();
  // const { activeItem } = useSidebar();

  // if (!breadcrumbs) {
  //   return null;
  // }

  // const homePageElement = activeItem;
  // const color = activeItem?.section || sections[0];

  // const docs: Array<{ id: string; path: string; sidebar: string }> =
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   (data["docusaurus-plugin-content-docs"].default as any).versions.find((item) => item.name === "current")?.docs ||
  //   [];

  // const currentDoc = docs.find((item) => item.path === location.pathname);
  // const parentParts = (currentDoc?.id || "").split("/");
  // parentParts.pop();
  // const parentPath = parentParts.join("/");

  // const pages = docs.filter((item) => {
  //   return item.id.startsWith(`${parentPath}/`);
  // });
  // const isTabView = pages.some((page) => page.id.includes("props"));

  // // eslint-disable-next-line no-nested-ternary
  // const tabs = currentDoc ? (isTabView ? pages : []) : [];

  // return (
  //   <>
  //     <nav className={clsx(ThemeClassNames.docs.docBreadcrumbs, "mb-4")}>
  //       <ul className="breadcrumbs" itemScope itemType="https://schema.org/BreadcrumbList">
  //         {homePageElement && color && (
  //           <li className="breadcrumbs__item">
  //             <Link
  //               to={homePageElement.link.path}
  //               className={`${color.text} ${color.textAction} ${color.textHover} group flex items-center lg:leading-6 font-semibold pr-1 md:pr-3 !w-fit`}
  //             >
  //               <div
  //                 className={`${color.icon} ${color.iconHover} flex items-center h-6 w-6 justify-center mr-2 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:shadow group-hover:ring-slate-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
  //               >
  //                 <homePageElement.img className="fill-white group-hover:fill-white/90 w-4 h-4" />
  //               </div>
  //               <span className={`${color.text} ${color.textAction} ${color.textHover} font-semibold hidden md:block`}>
  //                 {homePageElement.name}
  //               </span>
  //             </Link>
  //           </li>
  //         )}
  //         {breadcrumbs.map(getDocName).map((item, idx) => {
  //           const isLast = idx === breadcrumbs.length - 1;
  //           const href = item.type === "category" && item.linkUnlisted ? undefined : item.href;

  //           return (
  //             // eslint-disable-next-line react/no-array-index-key
  //             <BreadcrumbsItem key={idx} active={isLast} index={idx} addMicrodata={!!href}>
  //               <BreadcrumbsItemLink
  //                 href={href}
  //                 isLast={isLast}
  //                 className={`${color.text} ${color.textAction} ${color.textHover} capitalize`}
  //               >
  //                 {item.label}
  //               </BreadcrumbsItemLink>
  //             </BreadcrumbsItem>
  //           );
  //         })}
  //       </ul>
  //     </nav>
  //     {isTabView && (
  //       <NavTabs
  //         title={getLast(parentParts)}
  //         tabs={tabs.map((tab) => ({
  //           to: tab.path,
  //           label: getLast(tab.path.split("/")),
  //           active: currentDoc.path === tab.path,
  //         }))}
  //       />
  //     )}
  //   </>
  // );
}
