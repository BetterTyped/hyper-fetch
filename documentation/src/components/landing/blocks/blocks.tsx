/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { Particles } from "@site/src/components/particles";
import { Highlighter } from "@site/src/components/highlighter";
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import { Stage } from "@react-theater/scroll";
import { Description, Title } from "@site/src/components";
import App from "@site/static/img/previews/app.png";

import { BigBlock } from "./big-block/big-block";
import { MediumBlock } from "./medium-block/medium-block";

const FeatureImg02 = "/img/feature-integrations.png";
const FeatureImg03 = "/img/feature-image-03.png";

export const Blocks = () => {
  return (
    <section className="relative pb-20 ">
      {/* Particles animation */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-80 h-80 -mt-24 -ml-32">
        <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-16 md:pt-20">
          {/* Section header */}
          <div className="">
            <div className="max-w-3xl mx-auto text-center pb-6 md:pb-10">
              <div className="relative">
                <Stage onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                  <div className="sticky top-0">
                    <FadeIn start={0.05} end={0.25}>
                      <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                        Simply
                      </div>
                    </FadeIn>
                    <h2 className="h2 pb-2 flex justify-center flex-col md:flex-row">
                      <FadeIn start={0.05} end={0.25}>
                        <Title as="span" size="lg">
                          Faster.
                        </Title>
                      </FadeIn>
                      <FadeIn start={0.1} end={0.3}>
                        <Title as="span" size="lg">
                          Better.
                        </Title>
                      </FadeIn>
                    </h2>
                  </div>
                </Stage>
              </div>
              <FadeIn start={0.1} end={0.3}>
                <Description className="text-lg text-zinc-400">
                  Hyper Fetch provides a powerful, type-safe, backend & framework agnostic architecture for efficient
                  data exchange.
                </Description>
              </FadeIn>
            </div>
          </div>
          {/* Highlighted boxes */}
          <div className="relative pb-12 md:pb-20">
            {/* Blurred shape */}
            <div
              className="absolute bottom-0 -mb-20 left-1/2 -translate-x-1/2 blur-2xl pointer-events-none opacity-50 dark:opacity-50"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
                <defs>
                  <linearGradient id="bs2-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                    <stop offset="0%" stopColor="#fbc646" />
                    <stop offset="100%" stopColor="#fbc646" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="dark:fill-yellow-700 fill-yellow-300"
                  fillRule="evenodd"
                  d="m346 898 461 369-284 58z"
                  transform="translate(-346 -898)"
                />
              </svg>
            </div>
            <Highlighter className="grid md:grid-cols-12 gap-6 group">
              <Link to="/docs/hyper-flow" className="!no-underline md:col-span-12">
                <BigBlock
                  title="HyperFlow"
                  description="Inspect, debug, and manage your requests in real-time. Gain full visibility into caching, queuing, and the entire request lifecycle."
                  img={
                    <img
                      className="absolute top-0 left-0 w-[160%] max-w-[160%] h-auto mt-12 rounded-md overflow-hidden"
                      src={App}
                      alt="Feature 01"
                    />
                  }
                />
              </Link>
              <Link to="/docs/guides/typescript/extend" className="!no-underline md:col-span-7">
                <MediumBlock
                  title="Designed for Type Safety"
                  description="Leverage TypeScript to its full potential with automatic type generation, robust error handling, and enhanced developer confidence."
                  img={
                    <img
                      className="absolute w-[240%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg02}
                      alt="Feature 02"
                    />
                  }
                />
              </Link>
              <Link to="/docs/getting-started" className="!no-underline md:col-span-5">
                <MediumBlock
                  title="Flexible & Open Source"
                  description="Framework agnostic, built almost zero dependencies. Integrate seamlessly into any project and contribute to its growth."
                  img={
                    <img
                      className="absolute w-[160%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg03}
                      alt="Feature 03"
                    />
                  }
                />
              </Link>
            </Highlighter>
          </div>
        </div>
      </div>
    </section>
  );
};
