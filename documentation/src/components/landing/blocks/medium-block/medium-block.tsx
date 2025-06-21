import { Description, FadeIn, HighlighterItem, Title } from "@site/src/components";
import { ArrowRight } from "lucide-react";
import { cn } from "@site/src/lib/utils";

export const MediumBlock = ({
  img,
  title,
  description,
}: {
  img: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <FadeIn className="w-full h-full overflow-hidden" start={0.1} end={0.4} translateY={40}>
      <HighlighterItem>
        <div
          className={cn(
            "relative bg-zinc-50 dark:bg-zinc-900/80 h-full rounded-[inherit] z-20 overflow-hidden bg-with-noise",
            "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
          )}
        >
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-[3fr_1fr]">
              <div className="flex flex-col justify-between md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                <div className="mt-4">
                  <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1" className="text-2xl">
                    {title}
                  </Title>
                  <Description size="none" className="text-zinc-400">
                    {description}
                  </Description>
                </div>
                <span className="text-zinc-400 text-sm flex gap-1 items-center">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="relative w-full h-full overflow-hidden">{img}</div>
            </div>
          </div>
        </div>
      </HighlighterItem>
    </FadeIn>
  );
};
