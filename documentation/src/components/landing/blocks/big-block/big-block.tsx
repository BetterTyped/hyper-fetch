import { Particles, FadeIn, HighlighterItem, Title, Description } from "@site/src/components";
import { cn } from "@site/src/lib/utils";

export const BigBlock = ({ title, description, img }: { title: string; description: string; img: React.ReactNode }) => {
  return (
    <FadeIn className="w-full overflow-hidden" start={0.2} end={0.5} translateY={40}>
      <HighlighterItem>
        <div
          className={cn(
            "relative bg-zinc-50 dark:bg-zinc-900/80 h-full rounded-[inherit] z-20 overflow-hidden bg-with-noise",
            "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
          )}
        >
          <Particles className="absolute inset-0" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Blurred shape */}
            <div className="absolute right-0 top-0 blur-2xl opacity-50 dark:opacity-100" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="342" height="393">
                <defs>
                  <linearGradient id="bs-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                    <stop offset="0%" stopColor="#dbaa37" />
                    <stop offset="100%" stopColor="#e1a824" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="dark:fill-amber-700 fill-amber-300"
                  fillRule="evenodd"
                  d="m104 .827 461 369-284 58z"
                  transform="translate(0 -112.827)"
                  opacity=".7"
                />
              </svg>
            </div>
            {/* Radial gradient */}
            <div
              className="absolute flex items-center justify-center bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 h-full aspect-square"
              aria-hidden="true"
            >
              <div className="absolute inset-0 translate-z-0 dark:bg-yellow-500 bg-yellow-300 rounded-full blur-[120px] opacity-70" />
              <div className="absolute w-1/4 h-1/4 translate-z-0 dark:bg-yellow-400 bg-yellow-200 rounded-full blur-[40px]" />
            </div>
            {/* Text */}
            <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8 md:pr-0">
              <div className="mt-6 mb-5 md:mt-0">
                <div>
                  <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1" className="text-3xl">
                    {title}
                  </Title>
                  <Description size="none">{description}</Description>
                </div>
              </div>
              <div className="mt-auto">
                <span className="relative inline-flex items-center">
                  Learn more{" "}
                  <span className="tracking-normal text-blue-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">
                    →
                  </span>
                </span>
              </div>
            </div>
            {/* Image */}
            <div className="invisible md:visible relative w-full min-h-[300px] md:min-h-[400px] overflow-hidden">
              {img}
            </div>
          </div>
        </div>
      </HighlighterItem>
    </FadeIn>
  );
};
