/* eslint-disable react/no-array-index-key */
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Description, Title, Noise, DocsCard } from "@site/src/components";

export const Cards = () => {
  const { sidebar } = useSidebar();

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 my-10">
      {sidebar.map((item, index) => {
        return (
          <a href={item.link.path} key={index} style={{ textDecoration: "none" }}>
            <DocsCard className="h-full">
              <Noise visibility="medium" />
              <div className="flex flex-col p-6 h-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`${item.section.icon} ${item.section.iconHover} flex items-center h-6 w-6 min-h-6 min-w-6 justify-center mr-2 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                  >
                    <item.img className="group-hover:brightness-120 w-4 h-4" />
                  </div>
                </div>
                <Title size="none" className="font-semibold !leading-1" wrapperClass="flex flex-wrap !leading-6 mb-2">
                  {item.name}
                </Title>
                <Description size="none" className="!text-sm !m-0">
                  {item.description}
                </Description>
              </div>
            </DocsCard>
          </a>
        );
      })}
    </div>
  );
};
