import { Particles } from "@site/src/components/particles";
import React from "react";

import { SectionHeader } from "../shared/section-header";
import { ProductionBento } from "./production-bento";

/* "Ready for production": the bento of what ships with every request */
export const Production = () => {
  return (
    <section className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-80 h-80 -mt-24 -ml-32">
        <Particles
          className="absolute inset-0 -z-10"
          quantity={6}
          staticity={30}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 md:pt-20">
          <SectionHeader
            eyebrow="Built for shipping"
            title="Ready for production"
            description="Devtools, every runtime, instant UI and offline. Out of the box."
          />
          <div className="landing-scope relative pb-12 md:pb-20">
            <ProductionBento />
          </div>
        </div>
      </div>
    </section>
  );
};
