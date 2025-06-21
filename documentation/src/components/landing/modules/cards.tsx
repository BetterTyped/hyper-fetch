/* eslint-disable react/no-array-index-key */
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Description, FadeIn, Highlighter, HighlighterItem, Title } from "@site/src/components";
import { useWindowSize } from "@reins/hooks";
import { Theatre } from "@react-theater/scroll";
import { getAnimationValue } from "@site/src/utils/animation";
import Link from "@docusaurus/Link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@site/src/lib/utils";

export const Cards = () => {
  const [width] = useWindowSize();
  const { sidebar } = useSidebar({ showAllPackages: true });
  // eslint-disable-next-line no-nested-ternary
  const columns = width < 640 ? 1 : width < 1280 ? 2 : 3;
  const excludeFromPromoted = ["eslint"];

  const list = useMemo(() => {
    const items = sidebar.filter(
      (item) => !excludeFromPromoted.some((exclude) => item.name.toLowerCase().includes(exclude)),
    );

    if (columns === 1) {
      return items.slice(0, 3);
    }
    if (columns === 2) {
      return items.slice(0, 6);
    }

    return items.slice(0, 9);
  }, [sidebar, columns]);

  return (
    <Theatre>
      <Highlighter className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-10">
        {list.slice(0, 9).map((item, index) => {
          return (
            <FadeIn
              key={index}
              start={0.05 + getAnimationValue(columns, 0.08, index)}
              end={0.25 + getAnimationValue(columns, 0.08, index)}
            >
              <Link to={item.link.path} key={index} style={{ textDecoration: "none" }}>
                <HighlighterItem
                  className={cn(
                    "relative bg-zinc-50 dark:bg-zinc-900/80 h-full z-20 overflow-hidden rounded-2xl",
                    "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
                  )}
                >
                  <div className="flex flex-col py-6 px-8 h-full bg-with-noise">
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className={`${item.section.icon} ${item.section.iconHover} flex items-center size-9 justify-center mr-2 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                      >
                        <item.img className="group-hover:brightness-120 size-6" />
                      </div>
                    </div>
                    <Title size="none" className="font-bold !leading-[1.2] text-xl" wrapperClass="flex flex-wrap mb-2">
                      {item.name}
                    </Title>
                    <Description size="none" className="!text-base !m-0 line-clamp-3 leading-[1.4]">
                      {item.description}
                    </Description>
                    <span className="text-zinc-400 text-sm flex gap-1 items-center mt-5">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </HighlighterItem>
              </Link>
            </FadeIn>
          );
        })}
      </Highlighter>
      <div className="flex justify-center items-center w-full mt-10 mb-5">
        <Link to="/docs/integrations/getting-started" className="!no-underline flex items-center gap-2 w-fit text-lg">
          View all integrations <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </Theatre>
  );
};
