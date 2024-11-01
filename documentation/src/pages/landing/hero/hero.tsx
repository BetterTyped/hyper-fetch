/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Title } from "@site/src/components/title";
import { Particles } from "@site/src/components/particles";
import { Description } from "@site/src/components";
import Link from "@docusaurus/Link";
import { useClipboard, useIsMounted, useWindowSize } from "@reins/hooks";
import { useState } from "react";
import { Copy } from "lucide-react";

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
    <section className="relative w-[100vw] h-fit md:h-[calc(100vh-88px)] max-w-[100vw] text-center">
      {/* Illustration */}
      <div className="absolute w-[100vw] h-full pointer-events-none overflow-hidden p-10 opacity-20" aria-hidden="true">
        <div className="absolute left-1/4 -translate-x-1/2 bottom-0 -z-10">{/* <Glow /> */}</div>
      </div>
      {/* Particles animation */}
      <Particles className="absolute inset-0 -z-10" quantity={width > 767 ? 40 : 30} />

      {/* Hero content */}
      <div className="max-w-6xl mx-auto flex flex-col justify-center items-center h-full px-6">
        <div className="flex justify-center items-center mb-2">
          <img src="/img/brand/HF.svg" alt="" className="max-w-[320px] w-[70vw]" />
        </div>
        <Title
          as="h1"
          size="none"
          className="text-4xl md:text-6xl lg:text-[3.5rem]"
          wrapperClass="mt-3 md:mb-4 mb-0 md:mt-6 w-[900px] max-w-[90vw] text-[44px] !text-transparent text-center leading-[1.1] md:!leading-[1.3]"
        >
          Framework for seamless requests and real‑time connectivity
        </Title>
        <Description
          size="none"
          className="mb-3 md:mb-8 text-lg md:text-lg lg:text-xl text-zinc-300 dark:text-[#ababab] text-center !leading-[1.28] w-[700px] max-w-[90vw]"
        >
          For any{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            JavaScript / TypeScript
          </span>{" "}
          environment, including{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            Node.js
          </span>
          ,{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            React
          </span>
          ,{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            Angular
          </span>
          ,{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            Svelte
          </span>
          ,{" "}
          <span className="text-black dark:text-white" style={{ fontSize: "inherit" }}>
            Vue
          </span>{" "}
          and others.
        </Description>
        <div className="flex gap-4 mt-4 md:mt-10 flex-col md:flex-row justify-center mb-8">
          <Link
            to="docs/documentation"
            className="flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-500 via-yellow-600 to-yellow-500 text-white font-semibold rounded-xl p-[2px] max-w-full text-left text-sm md:text-md py-3 px-5 md:py-3 md:px-10 hover:from-yellow-400 hover:to-yellow-400 dark:hover:from-yellow-400 dark:hover:to-yellow-400 hover:text-white dark:hover:text-black transition-all"
          >
            Get Started
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => copy(installationCommand)}
              className="group btn-sm inline-flex items-center !px-5 !py-3 w-fit shiny-btn"
            >
              {!done && (
                <span className="text-sm group-hover:dark:text-white group-hover:text-black transition duration-150 ease-in-out">
                  npm install hyper-fetch
                </span>
              )}
              {done && <span className="text-sm">Copied to clipboard!</span>}
              <Copy className="w-[15px] ml-2 stroke-yellow-500 transition duration-150 ease-in-out" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
