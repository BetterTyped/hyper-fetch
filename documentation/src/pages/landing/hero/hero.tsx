/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Title } from "@site/src/components/title";
import { Particles } from "@site/src/components/particles";
import { Description } from "@site/src/components";
import Link from "@docusaurus/Link";
import { useClipboard, useIsMounted, useWindowSize } from "@reins/hooks";
import { useState } from "react";
import { ArrowRight, Copy } from "lucide-react";

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
    <section className="relative w-[100vw] h-fit max-w-[100vw] text-center">
      {/* Illustration */}
      <div className="absolute w-[100vw] pointer-events-none overflow-hidden p-10 opacity-20" aria-hidden="true">
        <div className="absolute left-1/4 -translate-x-1/2 bottom-0 -z-10">{/* <Glow /> */}</div>
      </div>
      {/* Particles animation */}
      <Particles className="absolute inset-0 -z-10" quantity={width > 767 ? 40 : 30} />

      {/* Hero content */}
      <div className="max-w-6xl mx-auto flex flex-col justify-center items-center px-6 mt-20 mb-12">
        {/* <div className="flex justify-center items-center mb-2">
          <img src="/img/brand/HF.svg" alt="" className="max-w-[320px] w-[70vw]" />
        </div> */}
        <div className="mb-1">
          <Link to="/enterprise" className="shiny-label !no-underline py-0.5">
            Enterprise ready
            <span className="tracking-normal text-yellow-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">
              →
            </span>
          </Link>
        </div>
        <Title
          as="h1"
          size="none"
          className="text-4xl md:text-6xl lg:text-[3.5rem]"
          wrapperClass="mt-3 md:mb-4 mb-0 md:mt-6 w-[900px] max-w-[90vw] text-[44px] !text-transparent text-center leading-[1.1] md:!leading-[1.3]"
        >
          Connect to any remote data. <br />
          With fast and safe framework.
        </Title>
        <Description
          size="none"
          className="mb-3 md:mb-8 text-lg md:text-lg lg:text-xl text-zinc-300 dark:text-[#ababab] text-center !leading-[1.28] w-[700px] max-w-[90vw]"
        >
          HyperFetch is a framework that makes it easy to connect your applications to the server data. Use{" "}
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
            className="flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl p-[2px] max-w-full text-left text-sm md:text-md py-2 px-4 md:py-2 md:px-6 hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
          >
            Get Started <ArrowRight className="w-[16px] ml-2" />
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => copy(installationCommand)}
              className="group btn-sm inline-flex items-center !px-3 !py-2 w-fit shiny-btn !rounded-lg"
            >
              {!done && (
                <span className="text-sm group-hover:dark:text-white group-hover:text-black transition duration-150 ease-in-out">
                  npm install hyper-fetch
                </span>
              )}
              {done && <span className="text-sm">Copied to clipboard!</span>}
              <Copy className="w-[15px] ml-3 stroke-zinc-500 dark:stroke-zinc-300 transition duration-150 ease-in-out" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
