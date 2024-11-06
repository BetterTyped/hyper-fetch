import { Description, FadeIn, HighlighterItem, Title } from "@site/src/components";

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
        <div className="relative bg-zinc-50 dark:bg-zinc-900 h-full rounded-[inherit] z-20 overflow-hidden">
          <div className="flex flex-col">
            {/* Radial gradient */}
            <div
              className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square"
              aria-hidden="true"
            >
              <div className="absolute inset-0 translate-z-0 bg-zinc-200 dark:bg-zinc-800 rounded-full blur-[80px]" />
            </div>
            <div className="grid grid-cols-[3fr_1fr]">
              {/* Text */}
              <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                <div>
                  <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1" className="text-2xl">
                    {title}
                  </Title>
                  <Description size="none" className="text-zinc-400">
                    {description}
                  </Description>
                </div>
              </div>
              {/* Image */}
              <div className="relative w-full h-full overflow-hidden">{img}</div>
            </div>
          </div>
        </div>
      </HighlighterItem>
    </FadeIn>
  );
};
