import { Description, FadeIn, HighlighterItem, Title } from "@site/src/components";
import { getAnimationValue } from "@site/src/utils/animation";

export const SmallBlock = ({
  title,
  description,
  index = 1,
}: {
  title: string;
  description: string;
  index?: number;
}) => {
  return (
    <FadeIn
      className="w-[100%] overflow-hidden md:col-span-3"
      start={0.1 + getAnimationValue(4, 0.05, index)}
      end={0.3 + getAnimationValue(4, 0.05, index)}
      translateY={40}
    >
      <HighlighterItem>
        <div className="relative bg-zinc-50 dark:bg-zinc-900 h-full rounded-[inherit] z-20 overflow-hidden">
          <div className="flex flex-col">
            {/* Radial gradient */}
            <div
              className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square"
              aria-hidden="true"
            >
              <div className="absolute inset-0 translate-z-0 bg-zinc-300 dark:bg-zinc-800 rounded-full blur-[80px]" />
            </div>
            {/* Text */}
            <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-4 md:p-6">
              <div>
                <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1 text-lg">
                  {title}
                </Title>
                <Description size="none" className="text-zinc-400 text-sm !mt-1 !mb-2">
                  {description}
                </Description>
              </div>
            </div>
          </div>
        </div>
      </HighlighterItem>
    </FadeIn>
  );
};
