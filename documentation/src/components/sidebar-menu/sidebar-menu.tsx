/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { SidebarItem, useSidebar } from "@site/src/hooks/use-sidebar";
import { cn } from "@site/src/lib/utils";
import Search from "@theme/NavbarItem/SearchNavbarItem";

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
        <div className="flex items-center justify-between gap-2 w-full [&>div]:w-full bg-gradient-to-b from-[#1c1c1d] to-transparent from-50% rounded-tr-md">
          <Search className="!px-0 !pt-0" />
        </div>
        {activeItem && (
          <div className="mt-4">
            <ul>
              {sidebar.map((item, index) => {
                const color = getColor(item);
                return (
                  <li key={index}>
                    <Link
                      to={item.link.path}
                      className={cn(
                        "group !no-underline flex items-center lg:text-sm lg:leading-6",
                        "mb-4 font-semibold capitalize",
                        color.text,
                        color.textAction,
                        color.textHover,
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center h-6 w-6 ",
                          "mr-4 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow",
                          "group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none",
                          "dark:group-hover:shadow-none dark:group-hover:highlight-white/10",
                          "dark:highlight-white/10",
                          color.icon,
                          color.iconHover,
                        )}
                      >
                        <item.img
                          className={`${item.active ? "brightness-110" : ""} group-hover:brightness-110  w-4 h-4`}
                        />
                      </div>
                      {item.name}
                      {item.isPro && (
                        <span className="ml-2 rounded-md bg-yellow-500 px-1.5 py-0.5 text-[11px] leading-none !text-black font-semibold no-underline group-hover:no-underline">
                          Pro
                        </span>
                      )}
                      {item.isNew && (
                        <span className="ml-2 rounded-md bg-lime-500 px-1.5 py-0.5 text-[11px] leading-none !text-black font-semibold no-underline group-hover:no-underline">
                          New
                        </span>
                      )}
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
