/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { sections } from "@site/src/sections";
import clsx from "clsx";

export const NavTabs = ({
  title,
  tabs,
}: {
  title: string;
  tabs: Array<{ to: string; label: string; active: boolean }>;
}) => {
  if (
    sections.some((section) => section.names.includes(title.toLocaleLowerCase())) ||
    !tabs.length ||
    tabs.length < 2
  ) {
    return null;
  }

  return (
    <div className="nav-tabs w-full mt-4 mb-8">
      <header>
        <h1 className="capitalize mt-6 mb-4">{title}</h1>
      </header>
      <div className="text-sm font-medium text-center max-w-full overflow-x-auto overflow-y-visible">
        <ul className="flex !pl-0 border-b-2 border-slate-200 dark:border-slate-600/40 ">
          {tabs.map((tab, idx) => (
            <li key={idx} className="z-10 relative">
              <Link
                className={clsx(
                  "inline-block font-semibold text-lg py-3 px-5 border-b-2 -mb-[2px] border-transparent rounded-t-lg !text-slate-400 dark:!text-slate-400 hover:!text-slate-600 hover:!border-slate-400 dark:hover:!text-slate-300 capitalize !no-underline",
                  {
                    "!border-blue-400 !text-slate-900 dark:!text-white dark:!border-blue-500": tab.active,
                  },
                )}
                to={tab.to}
              >
                {tab.label || "Usage"}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
