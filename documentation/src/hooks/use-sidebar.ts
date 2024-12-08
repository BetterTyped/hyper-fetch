import React, { useMemo } from "react";
import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";

import { useVersion } from "./use-version";
import { modules, Section } from "../modules";
import { integrations } from "../integrations";
import { apiOverviewSection } from "../apis";

type SidebarElement = {
  link: {
    path: string; // "/docs/components/"
    label: string; // "Intro"
  };
};

type Version = {
  docs: Array<{
    id: string;
    path: string;
    sidebar: string;
  }>;
  draftIds: unknown[];
  isLast: boolean;
  label: string; // "v1.0.0"
  mainDocId: string; // "documentation/index"
  name: string; // "current"
  path: string; // "/docs"
  sidebars: Record<string, SidebarElement>;
};

export type SidebarItem = {
  name: string;
  description: string;
  index: number;
  link: SidebarElement["link"];
  img: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active: boolean;
  section: (typeof modules)[number];
};

export const useSidebar = (options?: {
  showAllPackages?: boolean;
}): { sidebar: SidebarItem[]; activeItem: SidebarItem | null } => {
  const location = useLocation();
  const data = useGlobalData();

  const [version] = useVersion();

  const { showAllPackages = false } = options || {};
  const { versions } = data["docusaurus-plugin-content-docs"].default as {
    breadcrumbs: boolean;
    path: string; // "/docs"
    versions: Version[];
  };

  const currentVersion = versions.find((item: Version) => {
    return item.label === version;
  });

  const sidebar: SidebarItem[] = useMemo(() => {
    if (!currentVersion?.sidebars) return [];

    console.log(currentVersion.sidebars);

    return Object.values(currentVersion.sidebars)
      .filter((value) => {
        if (!value.link?.path) {
          console.log(value);
        }
        if (showAllPackages) return value.link.path.includes("/docs/api");
        // eslint-disable-next-line no-nested-ternary
        return location.pathname.includes("/docs/api")
          ? value.link.path.includes("/api")
          : location.pathname.includes("/docs/integrations")
            ? value.link.path.includes("/integrations")
            : !value.link.path.includes("/docs/api") && !value.link.path.includes("/docs/integrations");
      })
      .map((value) => {
        /**
         * DO NOT CHANGE!
         * @caution If it fails - you made mistake in the sidebar config :)
         */
        const componentName =
          value.link.path.includes("/integrations") ||
          value.link.path.includes("/plugins") ||
          value.link.path.includes("/api")
            ? value.link.path.split("/")[3]
            : value.link.path.split("/")[2];
        const component = componentName.toLocaleLowerCase();
        const allPackages = [
          apiOverviewSection,
          ...modules.filter((item) => item.isPackage),
          ...integrations.filter((item) => item.isPackage),
        ];

        const pkgIndex = modules.findIndex((item) =>
          item.paths.find((itemName) => itemName.toLowerCase() === component),
        );
        const integrationIndex = integrations.findIndex((item) =>
          item.paths.find((itemName) => itemName.toLowerCase() === component),
        );
        const packageIndex = allPackages.findIndex((item) =>
          item.paths.find((itemName) => itemName.toLowerCase() === component),
        );

        // eslint-disable-next-line no-nested-ternary
        const section: Section = showAllPackages
          ? allPackages[packageIndex]
          : // eslint-disable-next-line no-nested-ternary
            location.pathname.includes("/docs/integrations")
            ? integrations[integrationIndex]
            : location.pathname.includes("/docs/api")
              ? allPackages[packageIndex]
              : modules[pkgIndex];

        // eslint-disable-next-line no-nested-ternary
        const index: number = showAllPackages
          ? packageIndex
          : // eslint-disable-next-line no-nested-ternary
            location.pathname.includes("/docs/integrations")
            ? integrationIndex
            : location.pathname.includes("/docs/api")
              ? packageIndex
              : pkgIndex;

        // eslint-disable-next-line no-nested-ternary
        const prefix = location.pathname.includes("/docs/integrations")
          ? "integrations"
          : location.pathname.includes("/docs/api")
            ? "api"
            : "docs";

        const active =
          location.pathname.includes(`${prefix}/${component}/`) || location.pathname.endsWith(`${prefix}/${component}`);

        return {
          name: section?.label || componentName,
          description: section?.description || "",
          index,
          link: value.link,
          img: section?.img,
          active,
          section,
        } satisfies SidebarItem;
      })
      .filter((item) => item.section && (!showAllPackages || item.section.isPackage))
      .sort((a, b) => a.index - b.index);
  }, [currentVersion.sidebars, location.pathname, showAllPackages]);

  const activeItem = sidebar.find((item) => item.active) ?? null;

  return { sidebar, activeItem };
};
