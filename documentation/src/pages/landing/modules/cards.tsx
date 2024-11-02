/* eslint-disable react/no-array-index-key */
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Description, FadeIn, Title } from "@site/src/components";
import { useWindowSize } from "@reins/hooks";
import { Theatre } from "@react-theater/scroll";

const getAnimationValue = (value: number, index: number, windowWidth: number) => {
  // eslint-disable-next-line no-nested-ternary
  const cols = windowWidth < 640 ? 1 : windowWidth < 767 ? 2 : 3;
  return value * (index - cols * Math.floor(index / cols));
};

export const Cards = () => {
  const [width] = useWindowSize();
  const { sidebar } = useSidebar({ showAllPackages: true });

  return (
    <Theatre>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-10">
        {sidebar.map((item, index) => {
          return (
            <FadeIn
              key={index}
              start={0.05 + getAnimationValue(0.08, index, width)}
              end={0.25 + getAnimationValue(0.08, index, width)}
              className="bg-gradient-to-tr hover:dark:brightness-[120%] hover:brightness-[90%] dark:from-zinc-800 dark:to-zinc-800/25 from-zinc-100 to-zinc-100/25 rounded-3xl border dark:border-zinc-800 dark:hover:border-zinc-700/60 transition-colors group relative"
            >
              <a href={item.link.path} key={index} style={{ textDecoration: "none" }}>
                <div className="flex flex-col p-6 h-full">
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`${item.section.icon} ${item.section.iconHover} flex items-center h-6 w-6 min-h-6 min-w-6 justify-center mr-2 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                    >
                      <item.img className="stroke-white group-hover:stroke-white/90 w-4 h-4" />
                    </div>
                  </div>
                  <Title
                    size="none"
                    className="font-semibold !leading-[1.]"
                    wrapperClass="flex flex-wrap !leading-6 mb-2"
                  >
                    {item.name}
                  </Title>
                  <Description size="none" className="!text-sm !m-0">
                    {item.description}
                  </Description>
                </div>
              </a>
            </FadeIn>
          );
        })}
      </div>
    </Theatre>
  );
};
