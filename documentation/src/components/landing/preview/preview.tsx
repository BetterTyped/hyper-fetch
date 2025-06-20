import React from "react";
import DashboardPreview from "@site/static/img/previews/app.png";
import { Title } from "@site/src/components";
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import Link from "@docusaurus/Link";

import { BorderBeam } from "./border-beam";

export function Preview(): JSX.Element {
  return (
    <section className="relative pb-20 pt-4 -z-10 group mb-48">
      {/* <Particles className="absolute inset-0 -z-10" /> */}

      {/* Section header */}
      <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
        <FadeIn start={0.05} end={0.25}>
          <div>
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Power up your development workflow
            </div>
          </div>
        </FadeIn>
        <FadeIn start={0} end={0.2}>
          <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
            Hyper Flow
          </Title>
        </FadeIn>
        <FadeIn start={0.05} end={0.2}>
          <p className="text-lg text-zinc-400 mb-8">
            Experience next-level debugging with real-time request tracking, detailed error analysis, and comprehensive
            performance metrics.
          </p>
        </FadeIn>
        <FadeIn start={0.1} end={0.3}>
          <div className="flex justify-center">
            <Link
              className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
              to="/docs/hyper-flow/download"
            >
              Download Hyper Flow
            </Link>
          </div>
        </FadeIn>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />
        <FadeIn start={0.2} end={0.5}>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 rounded-md overflow-hidden -mb-[20vh]">
            <div className="relative w-fit h-fit rounded-md overflow-hidden">
              <BorderBeam duration={8} size={400} />
              <BorderBeam duration={8} size={400} />
              <img src={DashboardPreview} alt="preview" className="transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--background)] to-transparent from-5% to-20%" />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
