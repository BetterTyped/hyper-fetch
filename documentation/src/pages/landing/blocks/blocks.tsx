/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { Particles } from "@site/src/components/particles";
import { Highlighter } from "@site/src/components/highlighter";
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import { Stage } from "@react-theater/scroll";
import { Description, Title } from "@site/src/components";

import { BigBlock } from "./big-block/big-block";
import { MediumBlock } from "./medium-block/medium-block";
import { SmallBlock } from "./small-block/small-block";

const FeatureImg01 = "/img/feature-ecosystem.png";
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
            <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
              <div className="relative">
                <Stage onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                  <div className="sticky top-0">
                    <FadeIn start={0.25} end={0.45}>
                      <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                        Simply
                      </div>
                    </FadeIn>
                    <h2 className="h2 pb-2 flex justify-center flex-col md:flex-row">
                      <FadeIn start={0.3} end={0.45}>
                        <Title as="span" size="lg">
                          Faster.
                        </Title>
                      </FadeIn>
                      <FadeIn start={0.35} end={0.45}>
                        <Title as="span" size="lg">
                          Better.
                        </Title>
                      </FadeIn>
                    </h2>
                  </div>
                </Stage>
              </div>
              <FadeIn start={0.3} end={0.4}>
                <Description className="text-lg text-zinc-400">Description of the tool</Description>
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
              <Link to="/docs/documentation" className="!no-underline md:col-span-12">
                <BigBlock
                  title="Devtools Explorer"
                  description="We want to revolutionize the way building application is made. We want to make it easier, faster and more fun at the same time saving a lot of resources for business."
                  img={
                    <img
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 mx-auto max-w-none md:relative md:left-0 md:translate-x-0 py-8"
                      src={FeatureImg01}
                      width="504"
                      height="400"
                      alt="Feature 01"
                    />
                  }
                />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-7">
                <MediumBlock
                  title="Built for Type Safety"
                  description="Use it for new or already existing projects. It's built to integrate with any APIs and React frameworks of your choice."
                  img={
                    <img
                      className="absolute w-[240%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg02}
                      alt="Feature 02"
                    />
                  }
                />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-5">
                <MediumBlock
                  title="Open sourced"
                  description="We believe in the open source and transparency. Feel free to contribute, raise issues and submit pull requests."
                  img={
                    <img
                      className="absolute w-[160%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg03}
                      alt="Feature 03"
                    />
                  }
                />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-3">
                <SmallBlock title="Type Safety" description="Use it for new or already existing projects." index={0} />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-3">
                <SmallBlock title="Type Safety" description="Use it for new or already existing projects." index={1} />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-3">
                <SmallBlock title="Type Safety" description="Use it for new or already existing projects." index={2} />
              </Link>
              <Link to="/docs/documentation" className="!no-underline md:col-span-3">
                <SmallBlock title="Type Safety" description="Use it for new or already existing projects." index={3} />
              </Link>
            </Highlighter>
          </div>
        </div>
      </div>
    </section>
  );
};
