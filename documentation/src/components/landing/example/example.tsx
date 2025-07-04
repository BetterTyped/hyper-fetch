import React from "react";
import { Stage } from "@react-theater/scroll";
import { Description, FadeIn, Title } from "@site/src/components";

export function Example(): JSX.Element {
  return (
    <section className="relative pb-20 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
                  <h2 className="h2 pb-2 flex justify-center flex-col md:flex-row gap-1">
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
            <FadeIn start={0.3} end={0.6}>
              <Description className="text-lg !text-zinc-400">
                Reduce the time needed to handle state and reducers. Streamline HTTP adapter setup and its dependencies.
                Everything is set up right after installation in a fully configured environment with no external
                dependencies!
              </Description>
            </FadeIn>
          </div>
        </div>
        {/* Blurred shape */}
        <div
          className="absolute bottom-0 -mb-20 left-1/2 -translate-x-1/2 blur-2xl pointer-events-none opacity-50 dark:opacity-50 -rotate-45"
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
        <FadeIn start={0.2} end={0.6}>
          <div className="">
            <iframe
              src="https://codesandbox.io/embed/hyper-fetch-playground-zszubv?fontsize=14&hidenavigation=1&theme=dark"
              style={{ width: "100%", height: "600px", border: 0, borderRadius: "4px", overflow: "hidden" }}
              title="Hyper Fetch Playground"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
