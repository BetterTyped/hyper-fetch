/* eslint-disable jsx-a11y/anchor-is-valid */
import Link from "@docusaurus/Link";
import { Description, Title } from "@site/src/components";
import { ArrowRight, Download } from "lucide-react";

export const CallToAction = () => {
  return (
    <section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 overflow-hidden">
        <div className="relative px-8 py-12 md:py-20 overflow-hidden">
          {/* Radial gradient */}
          <div
            className="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/3 aspect-square max-w-[80vw]"
            aria-hidden="true"
          >
            <div className="absolute inset-0 translate-z-0 dark:bg-yellow-500 bg-yellow-300 rounded-full blur-[120px] opacity-70" />
            <div className="absolute w-1/4 h-1/4 translate-z-0 dark:bg-yellow-400 bg-yellow-200 rounded-full blur-[40px]" />
          </div>
          {/* Blurred shape */}
          <div
            className="absolute bottom-0 translate-y-1/2 left-0 blur-2xl opacity-50 pointer-events-none -z-10"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
              <defs>
                <linearGradient id="bs5-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                  <stop offset="0%" stopColor="#556bf7" />
                  <stop offset="100%" stopColor="#fbc646" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                className="dark:fill-yellow-700 fill-yellow-200"
                fillRule="evenodd"
                d="m0 0 461 369-284 58z"
                transform="matrix(1 0 0 -1 0 427)"
              />
            </svg>
          </div>
          {/* Content */}
          <div className="max-w-3xl mx-auto text-center">
            <div>
              <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-pink-500 dark:from-yellow-500 dark:to-yellow-200 pb-3">
                Improve your workflow today
              </div>
            </div>
            <Title className="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Build with HyperFetch
            </Title>
            <Description className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
              Spend less time on boilerplate and more on building amazing features that your users will love.
            </Description>
            <div className="flex gap-4 mt-4 md:mt-10 flex-col md:flex-row justify-center mb-8">
              <Link
                to="docs/getting-started"
                className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
              >
                Get Started <ArrowRight className="w-[16px] ml-2" />
              </Link>
              <Link
                to="docs/hyper-flow/download"
                className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-4 group inline-flex items-center shiny-btn !rounded-xl"
              >
                <Download className="w-[16px] mr-2" /> Download HyperFlow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
