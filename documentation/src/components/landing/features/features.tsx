/* eslint-disable react/no-array-index-key */
import { Description, Particles, Title } from "@site/src/components";
import { Activity, Code2, Globe, Layers, Layers3, Shield, Terminal, Wifi, Zap } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { AdapterSwapAnimation } from "./animations/adapter-swap";
import { RequestLifecycleAnimation } from "./animations/request-lifecycle";
import { SchemaToSdkAnimation } from "./animations/schema-to-sdk";
import { BigFeatureCard } from "./big-feature-card";

/* ─── Animation Variants ──────────────────────────────────────────── */

const tier1Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const tier2Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const tier2ItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

/* ─── Bottom Features (inline, no cards) ──────────────────────────── */

interface InlineFeature {
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
  tags: string[];
}

const inlineFeatures: InlineFeature[] = [
  {
    icon: Shield,
    label: "Type safety",
    title: "End-to-end TypeScript",
    description: "Params inferred from URL strings. Typed responses, payloads, query params, errors. Zero any.",
    tags: ["URL params", "Responses", "Payloads", "Query", "Errors"],
  },
  {
    icon: Code2,
    label: "React",
    title: "React hooks built in",
    description: "useFetch for queries. useSubmit for mutations. Loading, error, and data states all managed for you.",
    tags: ["useFetch", "useSubmit", "loading", "error", "data"],
  },
  {
    icon: Activity,
    label: "Devtools",
    title: "HyperFlow DevTools",
    description: "Inspect every request, cache entry, queue, and event. Debug your data layer visually.",
    tags: ["Network", "Cache", "Queues", "Events"],
  },
  {
    icon: Globe,
    label: "Runtimes",
    title: "Runs everywhere",
    description: "Browser, Node, edge, mobile, SSR. Same client, same behavior, every runtime.",
    tags: ["Browser", "Node", "Edge", "Mobile", "SSR"],
  },
  {
    icon: Zap,
    label: "Mutations",
    title: "Optimistic updates",
    description: "Mutate the UI first, reconcile with the server. Smooth, race-condition-free.",
    tags: ["Mutate first", "Reconcile", "Race-safe", "Rollback"],
  },
  {
    icon: Layers3,
    label: "Performance",
    title: "Smart deduplication",
    description: "Five components ask for the same data. One network call fires. Automatic.",
    tags: ["Shared promise", "One request", "Auto"],
  },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  Features Section                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

export function Features(): React.JSX.Element {
  return (
    <section className="relative py-20 md:py-28">
      {/* ── Background ──────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 -mx-28 overflow-hidden rounded-t-[3rem] opacity-40"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2">
          <img src="/img/glow-top.svg" className="max-w-none" width={1404} height={658} alt="" />
        </div>
      </div>
      <Particles className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Section Header ──────────────────────────────────── */}
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Why HyperFetch
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              One SDK. Any API.
            </Title>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Description className="text-lg !text-zinc-400 !mb-0">
              Stop juggling libraries, hand-typing types, and rebuilding cache, retries, and offline in every project.
              HyperFetch is the complete data layer for every protocol you ship.
            </Description>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TIER 1 — Three EQUAL Big Animated Cards               */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.div
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          variants={tier1Variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <BigFeatureCard
            icon={Terminal}
            label="CLI"
            title="Schema → typed SDK"
            description={
              <>
                Point at any OpenAPI spec, get a fully typed client. No hand-written interfaces, no{" "}
                <code className="text-rose-400">any</code>.
              </>
            }
            link="/docs/cli/overview"
            tags={["OpenAPI", "Swagger", "TypeScript", "Zero any"]}
          >
            <SchemaToSdkAnimation />
          </BigFeatureCard>

          <BigFeatureCard
            icon={Wifi}
            label="Adapters"
            title="Any protocol, one API"
            description="REST, GraphQL, Firebase, Sockets. Swap the adapter, keep the same createRequest / .send() everywhere."
            link="/docs/core/overview"
            tags={["REST", "GraphQL", "Firebase", "Sockets", "SSE"]}
          >
            <AdapterSwapAnimation />
          </BigFeatureCard>

          <BigFeatureCard
            icon={Layers}
            label="Data layer"
            title="Production data layer"
            description="Cache, queue, retry, dedup, offline replay. All built in. Stop re-implementing the same infra in every project."
            link="/docs/core/cache"
            tags={["Cache", "Queue", "Retry", "Dedup", "Offline"]}
          >
            <RequestLifecycleAnimation />
          </BigFeatureCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TIER 2 — Cardless feature list with per-item visuals   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.div
          className="mt-14 md:mt-20 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          variants={tier2Variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {inlineFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={tier2ItemVariants}
              className="group relative flex h-full flex-col"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                <feature.icon className="size-3.5" />
                {feature.label}
              </span>
              <h4 className="mt-2 text-xl font-extrabold tracking-tight text-zinc-100">{feature.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{feature.description}</p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
