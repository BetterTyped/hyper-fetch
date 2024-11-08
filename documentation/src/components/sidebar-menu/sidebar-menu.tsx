/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { SidebarItem, useSidebar } from "@site/src/hooks/use-sidebar";
import VersionDropdown from "@theme/NavbarItem/DocsVersionDropdownNavbarItem";

const getColor = (item: SidebarItem) => {
  return item.active
    ? item.section
    : {
        text: `text-zinc-500 dark:text-zinc-400`,
        textHover: item.section.textHover,
        textAction: item.section.textAction,
        icon: `group-hover:shadow-zinc-200 dark:group-hover:bg-zinc-500 bg-zinc-400 dark:bg-zinc-500`,
        iconHover: item.section.iconHover,
        active: false,
      };
};

export const SidebarMenu = () => {
  const { sidebar, activeItem } = useSidebar();

  return (
    <div className="px-4 min-w-[250px]">
      <div className="docs_sidebar">
        <VersionDropdown
          className="nav_versioning shadow-zinc-500/20 dark:shadow-zinc-200/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)] text-black/50 dark:text-white/60 py-1 px-4 font-bold leading-5 bg-zinc-400/20 dark:bg-zinc-400/10 rounded-full flex items-center space-x-2 w-fit hover:opacity-80"
          items={undefined}
          docsPluginId="default"
          dropdownItemsBefore={[]}
          dropdownItemsAfter={[]}
        />
        {activeItem && (
          <div className="mt-4">
            <ul>
              {sidebar.map((item, index) => {
                const color = getColor(item);
                return (
                  <li key={index}>
                    <Link
                      to={item.link.path}
                      className={`${color.text} ${color.textAction} ${color.textHover} !no-underline group flex items-center lg:text-sm lg:leading-6 mb-4 font-semibold capitalize`}
                    >
                      <div
                        className={`${color.icon} ${color.iconHover} flex items-center h-6 w-6 justify-center mr-4 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                      >
                        <item.img
                          className={`${item.active ? "brightness-110" : ""} group-hover:brightness-110  w-4 h-4`}
                        />
                      </div>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <hr className="h-px mt-6 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
};
