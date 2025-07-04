import React from "react";
import { useThemeConfig } from "@docusaurus/theme-common";
import Logo from "@theme/Logo";
import CollapseButton from "@theme/DocSidebar/Desktop/CollapseButton";
import Content from "@theme/DocSidebar/Desktop/Content";
import { useFilteredSidebar } from "@site/src/hooks/use-filtered-sidebar";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { modules } from "@site/src/modules";

import { SidebarMenu } from "../../../components/sidebar-menu/sidebar-menu";

const DocSidebarDesktop = ({ path, sidebar, onCollapse }) => {
  const {
    navbar: { hideOnScroll },
    docs: {
      sidebar: { hideable },
    },
  } = useThemeConfig();

  const filteredSidebar = useFilteredSidebar(sidebar);

  const { activeItem } = useSidebar();

  const color = activeItem?.section || modules[0];

  return (
    <div className="">
      {hideOnScroll && <Logo tabIndex={-1} />}
      <SidebarMenu />
      <div className={`custom-sidebar-menu ${color.text} ${color.textHover}`}>
        <Content path={path} sidebar={filteredSidebar} />
        {hideable && <CollapseButton onClick={onCollapse} />}
      </div>
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default React.memo(DocSidebarDesktop);
