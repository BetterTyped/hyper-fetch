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
import { ArrowRight, Atom, Database, Fingerprint, LucideProps, Server, TrendingUpDown, Wifi } from "lucide-react";
import { getAnimationValue } from "@site/src/utils/animation";
import { Description, FadeIn, Particles, Title } from "@site/src/components";

import "./animation.scss";

type FeatureItem = {
  name: string;
  description: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  link: JSX.Element;
};

// const FeatureList: FeatureItem[] = [
//   {
//     description: "Simple setup",
//     link: <Link to="/docs/guides/basic/setup">Read more</Link>,
//   },
//   {
//     description: "Automatic caching",
//     link: <Link to="/docs/documentation/core/cache">Read more</Link>,
//   },
//   {
//     description: "Built-in adapter",
//     link: <Link to="/docs/documentation/core/adapter">Read more</Link>,
//   },
//   {
//     description: "Request cancellation",
//     link: <Link to="/docs/guides/advanced/cancellation">Read more</Link>,
//   },
//   {
//     description: "Persistence",
//     link: <Link to="/docs/guides/advanced/persistence">Read more</Link>,
//   },
//   {
//     description: "Easy to test",
//     link: <Link to="/docs/documentation/getting-started/testing">Read more</Link>,
//   },
//   {
//     description: "Window Focus/Blur Events",
//     link: <Link to="/docs/guides/react/core/window-focus-blur">Read more</Link>,
//   },
//   {
//     description: "SSR Support",
//     link: <Link to="/docs/documentation/getting-started/environment">Read more</Link>,
//   },
//   {
//     description: "Authentication",
//     link: <Link to="/docs/guides/basic/authentication">Read more</Link>,
//   },
//   {
//     description: "Queueing",
//     link: <Link to="/docs/guides/advanced/queueing">Read more</Link>,
//   },
//   {
//     description: "Offline first ready",
//     link: <Link to="/docs/guides/advanced/offline">Read more</Link>,
//   },
//   {
//     description: "Prefetching",
//     link: <Link to="/docs/guides/advanced/prefetching">Read more</Link>,
//   },
// ];

const features: FeatureItem[] = [
  {
    name: "Automatic caching",
    description: "Automatically caches responses and reuses them when making the same request again.",
    icon: Database,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/core/cache">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: "Data Persistance",
    description: "Persists your data to the local storage or indexedDB to reuse it when needed.",
    icon: Atom,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/guides/advanced/persistence">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: "Server Components",
    description: "Supports server-side rendering and server components out of the box.",
    icon: Server,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/getting-started/environment">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: "Built-in Authentication",
    description: "Built-in authentication allow you to easily manage user sessions.",
    icon: Fingerprint,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/guides/basic/authentication">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: "Offline First",
    description:
      "Automatically uses cached data when the user is offline, and updates the cache when the user is online.",
    icon: Wifi,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/guides/advanced/offline">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: "Prefetching",
    description: "Prefetch data before components mount, so that it's available instantly when needed.",
    icon: TrendingUpDown,
    link: (
      <Link className="text-sm flex gap-1 items-center" to="/docs/guides/advanced/prefetching">
        Read more <ArrowRight className="size-3 translate-y-[1px]" />
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
    <section className="relative pb-20 pt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
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
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature */}
            {features.map((feature, index) => (
              <FadeIn
                key={index}
                start={0.1 + getAnimationValue(3, 0.05, index)}
                end={0.3 + getAnimationValue(3, 0.05, index)}
              >
                <div className="flex flex-col gap-2 h-full">
                  <div className="flex items-center space-x-2 mb-3">
                    <feature.icon className="size-7" />
                    <h5 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{feature.name}</h5>
                  </div>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400 flex-1">{feature.description}</p>
                  {feature.link}
                </div>
              </FadeIn>
            ))}
          </div>
        </Theatre>
        <div className="my-12">
          <FadeIn start={0.05} end={0.2}>
            <p className="text-md text-zinc-400">
              You can find more details in{" "}
              <Link className="text-yellow-500" to="/docs/getting-started/comparison">
                Comparison
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
