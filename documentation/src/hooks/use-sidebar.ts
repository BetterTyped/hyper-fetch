import type React from "react";
import { useMemo } from "react";
import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";

import { useVersion } from "./use-version";
import type { Section } from "../modules";
import { modules } from "../modules";
import { integrations } from "../integrations";
import { guides } from "../guides";
import { apiOverviewSection } from "../apis";

const VERSION_SEGMENT = /^v\d+\.\d+\.\d+$/;

/** e.g. /docs/integrations/foo/... or /docs/v7.0.0/integrations/foo/... → foo */
function segmentAfterPathMarker(path: string, marker: string): string {
  const parts = path.split("/").filter(Boolean);
  const i = parts.indexOf(marker);
  return parts[i + 1] ?? "";
}

/**
 * First docs slug: /docs/getting-started or /docs/v7.0.0/getting-started → getting-started
 * (skips optional version segment after docs)
 */
function docsRootSlugFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "docs") {
    return "";
  }
  let i = 1;
  if (VERSION_SEGMENT.test(parts[i] ?? "")) {
    i += 1;
  }
  return parts[i] ?? "";
}

function docRouteActive(pathname: string, prefix: string, component: string): boolean {
  const c = component.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (prefix === "docs") {
    return new RegExp(`/docs/(?:v\\d+\\.\\d+\\.\\d+/)?${c}(?:/|$)`).test(pathname);
  }
  const p = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`/docs/(?:v\\d+\\.\\d+\\.\\d+/)?${p}/${c}(?:/|$)`).test(pathname);
}

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
  isNew?: boolean;
  isPro?: boolean;
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

    // Versioned URLs use /docs/vX.Y.Z/integrations/... — do not use "/docs/integrations" (no version in between).
    const isApiPage = location.pathname.includes("/api/");
    const isIntegrationsPage = location.pathname.includes("/integrations/");
    const isGuidesPage = location.pathname.includes("/guides/");

    return Object.values(currentVersion.sidebars)
      .filter((value) => {
        if (!value.link?.path) {
          // eslint-disable-next-line no-console
          console.log("You must update the sidebars. Missing path for the following item");
          return false; // Ensure items without a path are filtered out
        }

        const linkPath = value.link.path;
        if (showAllPackages) {
          return !linkPath.includes("/api/") && !linkPath.includes("/guides/");
        }
        if (isApiPage) {
          return linkPath.includes("/api/");
        }
        if (isIntegrationsPage) {
          return linkPath.includes("/integrations/");
        }
        if (isGuidesPage) {
          return linkPath.includes("/guides/");
        }
        return !linkPath.includes("/api/") && !linkPath.includes("/integrations/") && !linkPath.includes("/guides/");
      })
      .map((value) => {
        const { path } = value.link;
        let componentName: string;
        if (path.includes("/integrations/")) {
          componentName = segmentAfterPathMarker(path, "integrations");
        } else if (path.includes("/guides/")) {
          componentName = segmentAfterPathMarker(path, "guides");
        } else if (path.includes("/api/")) {
          componentName = segmentAfterPathMarker(path, "api");
        } else {
          componentName = docsRootSlugFromPath(path);
        }
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

        const active = docRouteActive(location.pathname, prefix, component);

        return {
          name: section?.label || componentName,
          description: section?.description || "",
          index,
          link: value.link,
          img: section?.img,
          active,
          section,
          isNew: section?.isNew,
          isPro: section?.isPro,
        } satisfies SidebarItem;
      })
      .filter((item) => item.section && (!showAllPackages || item.section.isPackage))
      .sort((a, b) => a.index - b.index);
  }, [currentVersion.sidebars, location.pathname, showAllPackages]);

  const activeItem = sidebar.find((item) => item.active) ?? null;

  return { sidebar, activeItem };
};
