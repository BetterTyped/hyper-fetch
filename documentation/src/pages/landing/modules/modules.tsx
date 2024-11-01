/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import { Title } from "@site/src/components";

import { Cards } from "./cards";

export const Modules = () => {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <FadeIn start={0.05} end={0.25}>
              <div>
                <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                  Where DX meets business
                </div>
              </div>
            </FadeIn>
            <FadeIn start={0} end={0.2}>
              <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
                Scale your development
              </Title>
            </FadeIn>
            <FadeIn start={0.05} end={0.2}>
              <p className="text-lg text-zinc-400">
                With our platform you can build any type of application, from simple landing pages to complex enterprise
                systems.
              </p>
            </FadeIn>
          </div>

          <div className="relative mb-20">
            <Cards />
          </div>
        </div>
      </div>
    </section>
  );
};
