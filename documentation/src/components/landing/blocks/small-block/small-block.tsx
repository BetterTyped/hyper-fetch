import { Description, FadeIn, HighlighterItem, Title } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { getAnimationValue } from "@site/src/utils/animation";
import { ArrowRight } from "lucide-react";
import { ShineBorder } from "@site/src/components/ui/shine-beam";

export const SmallBlock = ({
  title,
  description,
  index = 1,
  icon,
  promo,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  index?: number;
  promo?: boolean;
}) => {
  return (
    <FadeIn
      className="w-full h-full overflow-hidden md:col-span-3"
      start={0.05 + getAnimationValue(4, 0.05, index)}
      end={0.2 + getAnimationValue(4, 0.05, index)}
      translateY={40}
    >
      <HighlighterItem className="h-full">
        {promo && <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
        <div
          className={cn(
            "relative bg-zinc-50 dark:bg-zinc-900/80 h-full rounded-[inherit] z-20 overflow-hidden bg-with-noise",
            "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Text */}
            <div className="flex flex-col md:max-w-[480px] shrink-0 order-1 md:order-none px-6 py-4 md:px-8 md:py-6 h-full">
              <div className="flex flex-col h-full">
                <div className="size-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">{icon}</div>
                <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1" className="text-2xl">
                  {title}
                </Title>
                <Description size="none" className="text-zinc-400 text-lg !mt-1 !mb-2 flex-1">
                  {description}
                </Description>
                <span className="text-zinc-400 text-sm flex gap-1 items-center mt-8">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </HighlighterItem>
    </FadeIn>
  );
};
