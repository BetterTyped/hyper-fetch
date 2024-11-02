/* eslint-disable react/no-array-index-key */
import { Particles } from "@site/src/components/particles";
import { Highlighter, HighlighterItem } from "@site/src/components/highlighter";
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import { Stage } from "@react-theater/scroll";
import { Description, Title } from "@site/src/components";
import Link from "@docusaurus/Link";

const FeatureImg01 = "/img/feature-ecosystem.png";
const FeatureImg02 = "/img/feature-integrations.png";
const FeatureImg03 = "/img/feature-image-03.png";

export const Summary = () => {
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
                <p className="text-lg text-zinc-400">Description of the tool</p>
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
            {/* Grid */}
            <Highlighter className="grid md:grid-cols-12 gap-6 group">
              {/* Box #1 */}
              <FadeIn className="w-[100%] overflow-hidden md:col-span-12" start={0.2} end={0.5} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
                  <HighlighterItem>
                    <div className="relative bg-zinc-50 dark:bg-zinc-900 h-full rounded-[inherit] z-20 overflow-hidden">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        {/* Blurred shape */}
                        <div className="absolute right-0 top-0 blur-2xl opacity-50 dark:opacity-100" aria-hidden="true">
                          <svg xmlns="http://www.w3.org/2000/svg" width="342" height="393">
                            <defs>
                              <linearGradient id="bs-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                                <stop offset="0%" stopColor="#fbc646" />
                                <stop offset="100%" stopColor="#fbc646" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path
                              className="dark:fill-yellow-700 fill-yellow-300"
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
                          <div className="mb-5">
                            <div>
                              <Title
                                size="none"
                                wrapperClass="inline-flex flex-wrap font-bold pb-1"
                                className="text-3xl"
                              >
                                Supercharged Devtools
                              </Title>
                              <Description size="none">
                                We want to revolutionize the way building application is made. We want to make it
                                easier, faster and more fun at the same time saving a lot of resources for business.
                              </Description>
                            </div>
                          </div>
                          <div>
                            <div className="btn-sm text-zinc-800 hover:text-black dark:text-zinc-300 dark:hover:text-white transition duration-150 ease-in-out group dark:[background:linear-gradient(theme(colors.slate.900),_theme(colors.slate.900))_padding-box,_conic-gradient(theme(colors.slate.400),_theme(colors.slate.700)_25%,_theme(colors.slate.700)_75%,_theme(colors.slate.400)_100%)_border-box] relative before:absolute before:inset-0 dark:before:bg-zinc-800/30 before:rounded-full before:pointer-events-none">
                              <span className="relative inline-flex items-center">
                                Learn more{" "}
                                <span className="tracking-normal text-blue-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">
                                  →
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Image */}
                        <div className="relative w-full h-48 md:h-auto overflow-hidden">
                          <img
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 mx-auto max-w-none md:relative md:left-0 md:translate-x-0 py-8"
                            src={FeatureImg01}
                            width="504"
                            height="400"
                            alt="Feature 01"
                          />
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
              {/* Box #2 */}
              <FadeIn className="w-[100%] overflow-hidden md:col-span-7" start={0.1} end={0.4} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
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
                        <div className="grid grid-cols-[3fr_1fr]">
                          {/* Text */}
                          <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                            <div>
                              <Title
                                size="none"
                                wrapperClass="inline-flex flex-wrap font-bold pb-1"
                                className="text-2xl"
                              >
                                Built for Type Safety
                              </Title>
                              <Description size="none" className="text-zinc-400">
                                Use it for new or already existing projects. It&apos;s built to integrate with any APIs
                                and React frameworks of your choice.
                              </Description>
                            </div>
                          </div>
                          {/* Image */}
                          <div className="relative w-full h-full overflow-hidden">
                            <img
                              className="absolute w-[240%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                              src={FeatureImg02}
                              alt="Feature 02"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
              {/* Box #3 */}
              <FadeIn className="w-[100%] overflow-hidden md:col-span-5" start={0.3} end={0.7} translateY={40}>
                <a href="https://github.com/BetterTyped/docsgen" className="!no-underline">
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
                        <div className="grid grid-cols-[3fr_1fr]">
                          {/* Text */}
                          <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                            <div>
                              <Title
                                size="none"
                                wrapperClass="inline-flex flex-wrap font-bold pb-1"
                                className="text-2xl"
                              >
                                Open sourced
                              </Title>
                              <Description size="none" className="text-zinc-400">
                                We believe in the open source and transparency. Feel free to contribute, raise issues
                                and submit pull requests.
                              </Description>
                            </div>
                          </div>
                          {/* Image */}
                          <div className="relative w-full h-full overflow-hidden">
                            <img
                              className="absolute w-[160%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                              src={FeatureImg03}
                              alt="Feature 03"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </a>
              </FadeIn>
              <FadeIn className="w-[100%] overflow-hidden md:col-span-3" start={0.1} end={0.4} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
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
                              Type Safety
                            </Title>
                            <Description size="none" className="text-zinc-400 text-sm !mt-1 !mb-2">
                              Use it for new or already existing projects.
                            </Description>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
              <FadeIn className="w-[100%] overflow-hidden md:col-span-3" start={0.1} end={0.4} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
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
                              Type Safety
                            </Title>
                            <Description size="none" className="text-zinc-400 text-sm !mt-1 !mb-2">
                              Use it for new or already existing projects.
                            </Description>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
              <FadeIn className="w-[100%] overflow-hidden md:col-span-3" start={0.1} end={0.4} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
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
                              Type Safety
                            </Title>
                            <Description size="none" className="text-zinc-400 text-sm !mt-1 !mb-2">
                              Use it for new or already existing projects.
                            </Description>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
              <FadeIn className="w-[100%] overflow-hidden md:col-span-3" start={0.1} end={0.4} translateY={40}>
                <Link to="/docs/documentation" className="!no-underline">
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
                              Type Safety
                            </Title>
                            <Description size="none" className="text-zinc-400 text-sm !mt-1 !mb-2">
                              Use it for new or already existing projects.
                            </Description>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HighlighterItem>
                </Link>
              </FadeIn>
            </Highlighter>
          </div>
        </div>
      </div>
    </section>
  );
};
