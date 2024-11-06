/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Particles } from "@site/src/components/particles";
import { Description, Title } from "@site/src/components";
import Link from "@docusaurus/Link";
import { useClipboard, useIsMounted, useWindowSize } from "@reins/hooks";
import { useState } from "react";
import { ArrowRight, Copy, Sparkles } from "lucide-react";
import Shape from "@site/static/img/shape.svg";

const installationCommand = "npm install @hyper-fetch/core";

export const Hero = () => {
  const isMounted = useIsMounted();
  const [done, setDone] = useState(false);
  const [width] = useWindowSize();

  const { copy } = useClipboard({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        if (isMounted) {
          setDone(false);
        }
      }, 1000);
    },
    onError: () => {},
  });

  return (
    <section className="relative w-[100vw] h-fit max-w-[100vw] text-center pt-[128px] pb-[68px] -mt-[88px]">
      {/* Illustrations */}
      <Shape
        preserveAspectRatio="none"
        className="absolute w-[100vw] h-full opacity-30 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-[1] stroke-zinc-400 dark:stroke-zinc-600"
      />
      <div className="absolute w-[100vw] h-full pointer-events-none p-10 inset-0" aria-hidden="true">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10">
          <img src="/img/glow-main.svg" className="max-w-none min-w-[100vw]" width={2546} alt="glow" />
        </div>
      </div>

      {/* Particles animation */}
      <Particles className="absolute inset-0 -z-10" quantity={width > 767 ? 40 : 30} />

      {/* Hero content */}
      <div className="relative max-w-6xl mx-auto flex flex-col justify-center items-center px-6 mt-12 mb-12">
        <div className="mb-1">
          <Link to="/enterprise" className="shiny-label flex items-center !no-underline py-0.5">
            <Sparkles className="w-[14px] h-[14px] text-yellow-600/80 dark:text-yellow-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out" />
            Enterprise ready
            <span className="w-[14px] h-[1px] leading-[0.2] tracking-normal text-yellow-600/90 dark:text-white group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out mr-0.5">
              →
            </span>
          </Link>
        </div>
        <Title
          as="h1"
          className="font-extrabold text-4xl md:text-6xl leading-[1.1] md:!leading-[1.3] lg:text-[3.5rem] mt-3 md:mb-4 mb-0 md:mt-6 max-w-[90vw] text-center"
        >
          Connect to any API. <br />
          Simply, TypeSafe, Perfected.
        </Title>
        <Description
          size="none"
          className="mb-3 md:mb-8 text-lg md:text-lg lg:text-xl text-zinc-300 dark:text-[#ababab] text-center !leading-[1.28] w-[700px] max-w-[90vw]"
        >
          Hyper Fetch is a framework that makes it easy to connect your frontends to the server data. Using{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            request
          </span>{" "}
          based or{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            real-time
          </span>{" "}
          connection.
        </Description>
        <div className="flex gap-4 mt-4 md:mt-10 flex-col md:flex-row justify-center mb-8">
          <Link
            to="docs/getting-started"
            className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
          >
            Get Started <ArrowRight className="w-[16px] ml-2" />
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => copy(installationCommand)}
              className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-4 group inline-flex items-center shiny-btn !rounded-xl"
            >
              {!done && (
                <span
                  className=" group-hover:dark:text-white group-hover:text-black transition duration-150 ease-in-out"
                  style={{
                    fontSize: "inherit",
                  }}
                >
                  npm install hyper-fetch
                </span>
              )}
              {done && (
                <span
                  style={{
                    fontSize: "inherit",
                  }}
                >
                  Copied to clipboard!
                </span>
              )}
              <Copy className="w-[15px] ml-3 stroke-zinc-500 dark:stroke-zinc-300 transition duration-150 ease-in-out" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
