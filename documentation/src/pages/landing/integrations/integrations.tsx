import { Theatre } from "@react-theater/scroll";
import { Description, ScaleOut, Title } from "@site/src/components";

/* eslint-disable react/no-array-index-key */
// 8 images
const integrationsInner = [];
// 12 images
const integrationsOuter = [];

export const Integrations = () => {
  return (
    <Theatre className="relative z-[-2] pt-48 -mb-[100px] md:-mb-[200px]">
      <div className="w-full max-w-[800px] mx-auto relative aspect-square flex items-center justify-center">
        <div className="relative z-10 max-w-[400px] text-center">
          <Title size="sm">Integrates with the tools of your choice</Title>
          <Description className="!mb-0">
            Written with no additional dependencies, fits perfectly into cutting edge solutions
          </Description>
        </div>
        <ScaleOut start={0.1} className="absolute w-full h-full flex items-center justify-center" isStage={false}>
          {/* Circle Inner */}
          <div
            className="absolute animate-spin"
            style={{
              animationDuration: "80s",
            }}
          >
            <div className="w-[500px] lg:w-[600px] aspect-square rounded-full border border-zinc-500 flex items-center justify-center">
              {integrationsInner.map((Icon, i) => (
                <div
                  className="absolute w-full h-10 md:h-12"
                  style={{
                    transform: `rotate(${i * (360 / integrationsInner.length)}deg)`,
                  }}
                >
                  <div
                    key={i}
                    className="relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 shiny-btn !rounded-full before:!rounded-full -translate-x-1/2 -translate-y-1/2"
                  >
                    <Icon
                      className="max-w-[50%] max-h-[50%]"
                      style={{
                        transform: `rotate(-90deg)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScaleOut>
        <ScaleOut start={0.2} className="absolute w-full h-full flex items-center justify-center" isStage={false}>
          {/* Circle Outer */}
          <div
            className="absolute animate-spin"
            style={{
              animationDuration: "120s",
              animationDirection: "reverse",
            }}
          >
            <div className="w-[700px] lg:w-[880px] aspect-square rounded-full border border-zinc-500 flex items-center justify-center">
              {integrationsOuter.map((Icon, i) => (
                <div
                  className="absolute w-full h-10 md:h-12"
                  style={{
                    transform: `rotate(${i * (360 / integrationsOuter.length)}deg)`,
                  }}
                >
                  <div
                    key={i}
                    className="relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 shiny-btn !rounded-full before:!rounded-full -translate-x-1/2 -translate-y-1/2"
                  >
                    <Icon
                      className="max-w-[50%] max-h-[50%]"
                      style={{
                        transform: `rotate(-90deg)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScaleOut>
      </div>
      {/* Backdrop */}
      <div className="absolute bottom-[-50vh] w-full h-[calc(70%+50vh)] z-[2] bg-gradient-to-b from-transparent to-[var(--background)] to-20%" />
    </Theatre>
  );
};
