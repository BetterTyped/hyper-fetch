/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from "react";
import Link from "@docusaurus/Link";
import { TimelineMax, Back } from "gsap";
import { Theatre } from "@react-theater/scroll";
import { ArrowRight } from "lucide-react";
import { Description, FadeIn, Particles, Title } from "@site/src/components";
import { cn } from "@site/src/lib/utils";

import "./animation.scss";
import { FeaturesCard } from "./features-card";
import { PointerHighlight } from "../../ui/pointer-highlight";
import { Scan } from "./scan";
import { AnimatedBeamDemo } from "./environments";
import { CliSdkDemo } from "./cli-sdk-demo";

type FeatureItem = {
  name: () => React.ReactNode;
  description: () => React.ReactNode;
  graphic: () => React.ReactNode;
  link: () => React.ReactNode;
  gridTotal?: string;
  graphicColSpan?: string;
  textColSpan?: string;
};

const features: FeatureItem[] = [
  {
    gridTotal: "md:grid-cols-5",
    graphicColSpan: "col-span-3",
    textColSpan: "col-span-2",
    name: () => <h5 className="text-6xl font-extrabold flex flex-wrap gap-2">SDK Generation</h5>,
    description: () => (
      <Description>
        Generate <b>type-safe SDKs</b> from OpenAPI/Swagger schemas with our powerful CLI. Get <b>tRPC-like syntax</b>{" "}
        with full autocompletion, zero-config setup, and <b>blazing-fast performance</b>. Your entire API surface
        becomes a typed object.
      </Description>
    ),
    graphic: () => <CliSdkDemo />,
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/cli/generate">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: () => (
      <h5 className="text-6xl font-extrabold flex flex-wrap gap-2">
        Built for{" "}
        <PointerHighlight
          containerClassName="[&>div]:z-[-1]"
          rectangleClassName="bg-gradient-to-r from-rose-500/40 to-orange-500/40 brightness-150 border-none"
        >
          <span className="text-6xl font-extrabold px-2 leading-[1.4]">AI and LLMs</span>{" "}
        </PointerHighlight>
      </h5>
    ),
    description: () => (
      <Description>
        Handle <b>streaming responses</b>, real-time updates, and long-running AI conversations with ease. Built-in
        support for <b>Server-Sent Events</b>, WebSockets, and request cancellation for modern AI applications.
      </Description>
    ),
    graphic: () => (
      <FeaturesCard right>
        <Scan />
      </FeaturesCard>
    ),
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/getting-started/ai">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: () => <h5 className="text-6xl font-extrabold flex flex-wrap gap-2">Framework Agnostic</h5>,
    description: () => (
      <Description>
        Works seamlessly with <b>React, Next.js, Remix, Astro, Node.js</b>, and any JavaScript framework. Same API, same
        patterns, same performance benefits - whether you&apos;re building <b>SPAs, SSR apps, or static sites</b>.
      </Description>
    ),
    graphic: () => {
      return <AnimatedBeamDemo />;
    },
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/getting-started#environments">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
];

export function Features(): JSX.Element {
  useEffect(() => {
    const bolt = document.querySelector(".bolt");
    const element = bolt.querySelector("div");

    const animation = new TimelineMax({
      onStart() {
        bolt.classList.add("animate");
      },
      onComplete() {
        bolt.classList.remove("animate");
        setTimeout(() => {
          animation.restart();
        }, 1000);
      },
    })
      .set(element, {
        rotation: 360,
      })
      .to(element, 0.7, {
        y: 80,
        rotation: 370,
      })
      .to(element, 0.6, {
        y: -140,
        rotation: 20,
      })
      .to(element, 0.1, {
        rotation: -24,
        y: 80,
      })
      .to(element, 0.8, {
        ease: Back.easeOut.config(1.6),
        rotation: 0,
        y: 0,
      });
  }, []);

  return (
    <section className="relative pb-5 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        {/* Illustration */}
        <div
          className="absolute inset-0 -z-10 -mx-28 rounded-t-[3rem] pointer-events-none overflow-hidden opacity-40"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10">
            <img src="/img/glow-top.svg" className="max-w-none" width={1404} height={658} alt="Features" />
          </div>
        </div>
        <Particles className="absolute inset-0 -z-10" />

        {/* Bolt */}
        <FadeIn start={0.05} end={0.25}>
          <div className="bolt">
            <svg viewBox="0 0 170 57" className="white left">
              <path d="M36.2701759,17.9733192 C-0.981139498,45.4810755 -7.86361824,57.6618438 15.6227397,54.5156241 C50.8522766,49.7962945 201.109341,31.1461782 161.361488,2" />
            </svg>
            <svg viewBox="0 0 170 57" className="white right">
              <path d="M36.2701759,17.9733192 C-0.981139498,45.4810755 -7.86361824,57.6618438 15.6227397,54.5156241 C50.8522766,49.7962945 201.109341,31.1461782 161.361488,2" />
            </svg>
            <div>
              <span />
            </div>
            <svg viewBox="0 0 112 44" className="circle">
              <path d="M96.9355003,2 C109.46067,13.4022454 131.614152,42 56.9906735,42 C-17.6328048,42 1.51790702,13.5493875 13.0513641,2" />
            </svg>
            <svg viewBox="0 0 70 3" className="line left">
              <path transform="translate(-2.000000, 0.000000)" d="M2,1.5 L70,1.5" />
            </svg>
            <svg viewBox="0 0 70 3" className="line right">
              <path transform="translate(-2.000000, 0.000000)" d="M2,1.5 L70,1.5" />
            </svg>
          </div>
        </FadeIn>

        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center pb-20 md:pb-32">
          <FadeIn start={0.01} end={0.18}>
            <div>
              <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                The future is now.
              </div>
            </div>
          </FadeIn>
          <FadeIn start={0} end={0.15}>
            <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Control your architecture
            </Title>
          </FadeIn>
          <FadeIn start={0.02} end={0.2}>
            <Description className="text-lg !text-zinc-400">
              Easily connect to the events that power our architecture and confidently create your own logic. We give
              you full control over your data flow like no other framework can.
            </Description>
          </FadeIn>
        </div>

        {/* Features list */}
        <Theatre>
          <div className="grid w-full">
            {/* Feature */}
            {features.map((feature, index) => {
              const gridTotal = feature.gridTotal || "md:grid-cols-2";
              const graphicColSpan = feature.graphicColSpan || "md:col-span-1";
              const textColSpan = feature.textColSpan || "md:col-span-1";

              return (
                <div>
                  <div className={cn("grid gap-10 md:gap-20 items-center", `${gridTotal}`)} key={index}>
                    <div
                      className={cn(
                        "flex items-center justify-center",
                        `${graphicColSpan}`,
                        index % 2 === 0 && "order-2",
                      )}
                    >
                      <feature.graphic />
                    </div>
                    <div className={cn(textColSpan)}>
                      <FadeIn start={0.02} end={0.2}>
                        <feature.name />
                      </FadeIn>
                      <FadeIn start={0.05} end={0.3}>
                        <div className="flex-1 mt-1 max-w-md">
                          <feature.description />
                        </div>
                      </FadeIn>
                      <FadeIn start={0.08} end={0.35}>
                        <div className="mt-4">
                          <feature.link />
                        </div>
                      </FadeIn>
                    </div>
                  </div>
                  {index !== features.length - 1 && (
                    <div className="flex justify-center items-center pt-24 pb-12">
                      <div className="flex gap-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              i === 2 ? "bg-gradient-to-r from-rose-400 to-orange-400" : "bg-zinc-700",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Theatre>
      </div>
    </section>
  );
}
