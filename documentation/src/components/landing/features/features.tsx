/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { Description, Particles, Title } from "@site/src/components";
import { useWindowSize } from "@site/src/hooks/use-window-size";
import { cn } from "@site/src/lib/utils";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";

import { CodeSnippet } from "./code-snippet";

type FeatureItem = {
  name: () => React.ReactNode;
  description: () => React.ReactNode;
  graphic: () => React.ReactNode;
  link: () => React.ReactNode;
};

const typeSafetyCode = [
  [
    { text: "const ", type: "keyword" as const },
    { text: "getUser" },
    { text: " = " },
    { text: "client" },
    { text: "." },
    { text: "createRequest", type: "method" as const },
    { text: "<{" },
  ],
  [
    { text: "  response", type: "property" as const },
    { text: ": " },
    { text: "User", type: "type" as const },
    { text: ";" },
  ],
  [
    { text: "  error", type: "property" as const },
    { text: ": " },
    { text: "ValidationError", type: "type" as const },
    { text: ";" },
  ],
  [{ text: "}>()({" }],
  [
    { text: "  endpoint", type: "property" as const },
    { text: ": " },
    { text: '"/users/:userId"', type: "string" as const },
    { text: "," },
  ],
  [
    { text: "  method", type: "property" as const },
    { text: ": " },
    { text: '"GET"', type: "string" as const },
    { text: "," },
  ],
  [{ text: "});" }],
  [],
  [{ text: "// userId is inferred from the endpoint string", type: "comment" as const }],
  [
    { text: "getUser" },
    { text: "." },
    { text: "setParams", type: "method" as const },
    { text: "({ " },
    { text: "userId", type: "property" as const },
    { text: ": " },
    { text: "1", type: "number" as const },
    { text: " });" },
  ],
  [{ text: "//        ^ full autocompletion", type: "comment" as const }],
];

const universalCode = [
  [{ text: "// REST - default adapter", type: "comment" as const }],
  [
    { text: "const ", type: "keyword" as const },
    { text: "client" },
    { text: " = " },
    { text: "createClient", type: "method" as const },
    { text: "({ " },
    { text: "url", type: "property" as const },
    { text: ": " },
    { text: '"https://api.example.com"', type: "string" as const },
    { text: " });" },
  ],
  [],
  [{ text: "// GraphQL - same pattern", type: "comment" as const }],
  [
    { text: "const ", type: "keyword" as const },
    { text: "gqlClient" },
    { text: " = " },
    { text: "createClient", type: "method" as const },
    { text: "({ " },
    { text: "url", type: "property" as const },
    { text: ": " },
    { text: '"..."', type: "string" as const },
    { text: " })" },
  ],
  [
    { text: "  ." },
    { text: "setAdapter", type: "method" as const },
    { text: "(" },
    { text: "graphqlAdapter" },
    { text: ");" },
  ],
  [],
  [{ text: "// Firebase - same pattern", type: "comment" as const }],
  [
    { text: "const ", type: "keyword" as const },
    { text: "fbClient" },
    { text: " = " },
    { text: "createClient", type: "method" as const },
    { text: "({ " },
    { text: "url", type: "property" as const },
    { text: ": " },
    { text: '"..."', type: "string" as const },
    { text: " })" },
  ],
  [
    { text: "  ." },
    { text: "setAdapter", type: "method" as const },
    { text: "(" },
    { text: "firebaseAdapter" },
    { text: ");" },
  ],
  [],
  [{ text: "// Same API everywhere", type: "comment" as const }],
  [
    { text: "client" },
    { text: "." },
    { text: "createRequest", type: "method" as const },
    { text: "()({ " },
    { text: "endpoint", type: "property" as const },
    { text: ": " },
    { text: '"/users"', type: "string" as const },
    { text: " })." },
    { text: "send", type: "method" as const },
    { text: "();" },
  ],
];

const builtInCode = [
  [
    { text: "const ", type: "keyword" as const },
    { text: "getUsers" },
    { text: " = " },
    { text: "client" },
    { text: "." },
    { text: "createRequest", type: "method" as const },
    { text: "()({" },
  ],
  [
    { text: "  endpoint", type: "property" as const },
    { text: ": " },
    { text: '"/users"', type: "string" as const },
    { text: "," },
  ],
  [
    { text: "  method", type: "property" as const },
    { text: ": " },
    { text: '"GET"', type: "string" as const },
    { text: "," },
  ],
  [
    { text: "  cache", type: "property" as const },
    { text: ": " },
    { text: "true", type: "keyword" as const },
    { text: "," },
  ],
  [
    { text: "  cacheTime", type: "property" as const },
    { text: ": " },
    { text: "50000", type: "number" as const },
    { text: "," },
  ],
  [
    { text: "  retry", type: "property" as const },
    { text: ": " },
    { text: "3", type: "number" as const },
    { text: "," },
  ],
  [
    { text: "  deduplication", type: "property" as const },
    { text: ": " },
    { text: "true", type: "keyword" as const },
    { text: "," },
  ],
  [
    { text: "  offline", type: "property" as const },
    { text: ": " },
    { text: "true", type: "keyword" as const },
    { text: "," },
  ],
  [{ text: "});" }],
];

const features: FeatureItem[] = [
  {
    name: () => (
      <h5 className="text-4xl md:text-5xl font-extrabold flex flex-wrap gap-2 leading-tight">
        One interface for every API
      </h5>
    ),
    description: () => (
      <Description>
        REST, GraphQL, Firebase, WebSockets, SSE - the same <b>createRequest / .send()</b> pattern everywhere. Swap
        adapters without rewriting code.
      </Description>
    ),
    graphic: () => <CodeSnippet lines={universalCode} />,
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/core/overview">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: () => (
      <h5 className="text-4xl md:text-5xl font-extrabold flex flex-wrap gap-2 leading-tight">
        Tired of <code className="text-rose-400">any</code> leaking through your data layer?
      </h5>
    ),
    description: () => (
      <Description>
        End-to-end TypeScript from schema to response. Typed <b>params, payloads, query params, errors</b>. Full
        autocompletion. Zero <code>any</code>.
      </Description>
    ),
    graphic: () => <CodeSnippet lines={typeSafetyCode} />,
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/guides/typescript/extend">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
  {
    name: () => (
      <h5 className="text-4xl md:text-5xl font-extrabold flex flex-wrap gap-2 leading-tight">
        Cache, queues, retries, offline - built in
      </h5>
    ),
    description: () => (
      <Description>
        Smart caching, request queuing, retries, offline support, optimistic updates, deduplication. Same behavior in
        browser, server, edge, mobile.
      </Description>
    ),
    graphic: () => <CodeSnippet lines={builtInCode} />,
    link: () => (
      <Link className="text-sm flex gap-1 items-center" to="/docs/core/cache">
        Learn more <ArrowRight className="size-3 translate-y-[1px]" />
      </Link>
    ),
  },
];

export function Features(): React.JSX.Element {
  const [isMobile, setIsMobile] = useState(false);

  useWindowSize(([width]) => {
    if (width < 768 && !isMobile) {
      setIsMobile(true);
    } else if (width >= 768 && isMobile) {
      setIsMobile(false);
    }
  });

  return (
    <section className="relative pb-5 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div
          className="absolute inset-0 -z-10 -mx-28 rounded-t-[3rem] pointer-events-none overflow-hidden opacity-40"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10">
            <img src="/img/glow-top.svg" className="max-w-none" width={1404} height={658} alt="Features" />
          </div>
        </div>
        <Particles className="absolute inset-0 -z-10" />

        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center pb-20 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div>
              <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                Stop fighting your data layer
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Problems HyperFetch solves
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Description className="text-lg !text-zinc-400">
              Three things every TypeScript app re-invents - and how HyperFetch removes them.
            </Description>
          </motion.div>
        </div>

        {/* Features list */}
        <motion.div
          className="grid w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {features.map((feature, index) => {
            const order = index % 2 === 0 ? "md:order-1" : "!md:order-0";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <div className="grid gap-10 md:gap-20 items-center md:grid-cols-2">
                  <div className={cn("flex items-center justify-center", isMobile ? "order-1" : order)}>
                    <feature.graphic />
                  </div>
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <feature.name />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="flex-1 mt-1 max-w-md">
                        <feature.description />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="mt-4">
                        <feature.link />
                      </div>
                    </motion.div>
                  </div>
                </div>
                {index !== features.length - 1 && (
                  <motion.div
                    className="flex justify-center items-center pt-12 md:pt-24 pb-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
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
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
