import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Description, Title } from "@site/src/components";

export const Cards = () => {
  const { sidebar } = useSidebar(true);

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-10">
      {sidebar.map((item, index) => {
        return (
          <a
            href={item.link.path}
            key={index}
            className="bg-gradient-to-tr hover:dark:brightness-[120%] hover:brightness-[90%] dark:from-slate-800 dark:to-slate-800/25 from-slate-100 to-slate-100/25 rounded-3xl border dark:border-slate-800 dark:hover:border-slate-700/60 transition-colors group relative"
            style={{ textDecoration: "none" }}
          >
            <div className="flex flex-col p-6 h-full">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`${item.section.icon} ${item.section.iconHover} flex items-center h-6 w-6 min-h-6 min-w-6 justify-center mr-2 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:shadow group-hover:ring-slate-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                >
                  <item.img className="fill-white group-hover:fill-white/90 w-4 h-4" />
                </div>
              </div>
              <Title size="none" className="font-semibold !leading-0" wrapperClass="flex flex-wrap !leading-3 mb-2">
                {item.name}
              </Title>
              <Description size="none" className="!text-sm !m-0">
                {item.description}
              </Description>
            </div>
          </a>
        );
      })}
    </div>
  );
};
