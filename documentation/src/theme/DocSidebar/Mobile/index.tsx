import React from "react";
import { NavbarSecondaryMenuFiller } from "@docusaurus/theme-common";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import DocSidebarItems from "@theme/DocSidebarItems";
import { useFilteredSidebar } from "@site/src/hooks/use-filtered-sidebar";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { sections } from "@site/src/sections";

import { SidebarMenu } from "../../../components/sidebar-menu/sidebar-menu";

const DocSidebarMobileSecondaryMenu = ({ sidebar, path }) => {
  const mobileSidebar = useNavbarMobileSidebar();

  const filteredSidebar = useFilteredSidebar(sidebar);

  const { activeItem } = useSidebar();
  const color = activeItem?.section || sections[0];

  return (
    <div>
      <SidebarMenu />

      <div className={`custom-sidebar-menu ${color.text} ${color.textHover}`}>
        <DocSidebarItems
          items={filteredSidebar}
          activePath={path}
          onItemClick={(item) => {
            // Mobile sidebar should only be closed if the category has a link
            if (item.type === "category" && item.href) {
              mobileSidebar.toggle();
            }
            if (item.type === "link") {
              mobileSidebar.toggle();
            }
          }}
          level={1}
        />
      </div>
    </div>
  );
};
const DocSidebarMobile = (props) => {
  return <NavbarSecondaryMenuFiller component={DocSidebarMobileSecondaryMenu} props={props} />;
};

// eslint-disable-next-line import/no-default-export
export default React.memo(DocSidebarMobile);
