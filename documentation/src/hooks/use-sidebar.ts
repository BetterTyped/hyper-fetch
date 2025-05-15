import React, { useMemo } from "react";
import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";

import { useVersion } from "./use-version";
import { modules, Section } from "../modules";
import { integrations } from "../integrations";
import { guides } from "../guides";
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
  section: Section;
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

    const isApiPage = location.pathname.includes("/docs/api");
    const isIntegrationsPage = location.pathname.includes("/docs/integrations");
    const isGuidesPage = location.pathname.includes("/docs/guides");

    return Object.values(currentVersion.sidebars)
      .filter((value) => {
        if (!value.link?.path) {
          // eslint-disable-next-line no-console
          console.log("You must update the sidebars. Missing path for the following item");
          return false; // Ensure items without a path are filtered out
        }

        const linkPath = value.link.path;
        if (showAllPackages) {
          return linkPath.includes("/docs/api");
        }
        if (isApiPage) {
          return linkPath.includes("/api");
        }
        if (isIntegrationsPage) {
          return linkPath.includes("/integrations");
        }
        if (isGuidesPage) {
          return linkPath.includes("/guides");
        }
        return (
          !linkPath.includes("/docs/api") &&
          !linkPath.includes("/docs/integrations") &&
          !linkPath.includes("/docs/guides")
        );
      })
      .map((value) => {
        /**
         * DO NOT CHANGE!
         * @caution If it fails - you made mistake in the sidebar config :)
         */
        const pathParts = value.link.path.split("/");
        const isNonDocs =
          value.link.path.includes("/integrations") ||
          value.link.path.includes("/guides") ||
          value.link.path.includes("/api");
        const componentName = isNonDocs ? pathParts[3] : pathParts[2];
        const component = componentName.toLocaleLowerCase();

        const allPackages = [
          apiOverviewSection,
          ...modules.filter((item) => item.isPackage),
          ...integrations.filter((item) => item.isPackage),
        ];

        const findIndex = (items: Section[], comp: string) =>
          items.findIndex((item) => item.paths.find((itemName) => itemName.toLowerCase() === comp));

        let section: Section | undefined;
        let index: number;
        let prefix: string;

        if (showAllPackages) {
          const packageIndex = findIndex(allPackages, component);
          section = allPackages[packageIndex];
          index = packageIndex;
          // Prefix determination might need refinement based on showAllPackages logic,
          // defaulting to 'docs' or inferring from section path if needed.
          prefix = "docs"; // Or determine more dynamically if required
        } else if (isIntegrationsPage) {
          const integrationIndex = findIndex(integrations, component);
          section = integrations[integrationIndex];
          index = integrationIndex;
          prefix = "integrations";
        } else if (isApiPage) {
          const packageIndex = findIndex(allPackages, component);
          section = allPackages[packageIndex];
          index = packageIndex;
          prefix = "api";
        } else if (isGuidesPage) {
          const pkgIndex = findIndex(guides, component);
          section = guides[pkgIndex];
          index = pkgIndex;
          prefix = "guides";
        } else {
          const pkgIndex = findIndex(modules, component);
          section = modules[pkgIndex];
          index = pkgIndex;
          prefix = "docs";
        }

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
