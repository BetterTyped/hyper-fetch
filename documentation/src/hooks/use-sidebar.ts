import { useMemo } from "react";
import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";

import { useVersion } from "./use-version";
import { sections } from "../sections";

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
  section: (typeof sections)[number];
};

export const useSidebar = (onlyPackages?: boolean): { sidebar: SidebarItem[]; activeItem: SidebarItem | null } => {
  const location = useLocation();
  const data = useGlobalData();

  const [version] = useVersion();

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
    return Object.values(currentVersion.sidebars).map((value) => {
      /**
       * DO NOT CHANGE!
       * @caution If it fails - you made mistake in the sidebar config :)
       */
      const componentName = value.link.path.split("/")[2];
      const component = componentName.toLocaleLowerCase();
      const sectionIndex = sections.findIndex((item) =>
        item.names.find((itemName) => itemName.toLowerCase() === component),
      );
      const section = sections[sectionIndex];
      const active = location.pathname.includes(component);
      return {
        name: section?.label || componentName,
        description: section?.description || "",
        index: sectionIndex,
        link: value.link,
        img: section?.img,
        active,
        section,
      } satisfies SidebarItem;
    });
  }, [version])
    .filter((item) => item.section && (!onlyPackages || item.section.isPackage))
    .sort((a, b) => a.index - b.index);

  const activeItem = sidebar.find((item) => item.active) ?? null;

  return { sidebar, activeItem };
};
