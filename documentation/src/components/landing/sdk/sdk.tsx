import React from "react";

import { BentoCard, BentoGrid } from "../shared/bento-card";
import { SectionHeader } from "../shared/section-header";
import { AdapterSwapAnimation } from "./animations/adapter-swap";
import { RequestLifecycleAnimation } from "./animations/request-lifecycle";
import { SchemaToSdkAnimation } from "./animations/schema-to-sdk";
import { SdkFeatures } from "./sdk-features";

const VISUAL = "h-[300px] lg:flex-none";

/*
 * "Your backend, as a typed SDK": the story in three cards (get the SDK, plug in a protocol, ship it),
 * then the six features. The cards run as wide as the "Ready for production" bento, the features as
 * wide as the BetterTyped numbers.
 */
export const Sdk = () => (
  <section className="relative py-16 md:py-24">
    {/* One soft amber light behind the head, fading out before the cards */}
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      aria-hidden
    >
      <div className="absolute left-1/2 top-[-260px] h-[520px] w-[880px] max-w-[95vw] -translate-x-1/2 rounded-full bg-[#fbc646] opacity-[0.07] blur-[120px]" />
    </div>

    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="SDK from your code"
        title="Your backend, as a typed SDK"
        description="Generate it from OpenAPI in one command, or read it from your Hono and Elysia types. No hand-written client."
      />

      <div className="relative left-1/2 w-screen max-w-[1400px] -translate-x-1/2 px-4 sm:px-6 lg:px-8">
        <BentoGrid className="grid-cols-1 lg:grid-cols-3">
          <BentoCard
            feature
            i={0}
            title="Get your SDK"
            line="Generate it or write it. Fully typed."
            visualClassName={VISUAL}
          >
            <SchemaToSdkAnimation />
          </BentoCard>
          <BentoCard
            feature
            i={1}
            title="Plug in any protocol"
            line="Swap the adapter. Same calls."
            visualClassName={VISUAL}
          >
            <AdapterSwapAnimation />
          </BentoCard>
          <BentoCard
            feature
            i={2}
            title="Ship it"
            line="Cache, retries and offline. Built in."
            visualClassName={VISUAL}
          >
            <RequestLifecycleAnimation />
          </BentoCard>
        </BentoGrid>
      </div>

      <div className="landing-scope mx-auto mt-14 max-w-[1104px] md:mt-20">
        <SdkFeatures />
      </div>
    </div>
  </section>
);
