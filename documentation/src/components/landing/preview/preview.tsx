import Link from "@docusaurus/Link";
import { Description, Title } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import DashboardPreview from "@site/static/img/previews/app.png";
import { ArrowRight, Database, Gauge, Network, Workflow } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { Noise } from "../../ui/noise";
import { BorderBeam } from "./border-beam";
import { CacheHitRateVisual, MetricsSparklineVisual, NetworkLogVisual, QueueFlowVisual } from "./devtools-visuals";

interface DevtoolsFeature {
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
  link: string;
  visual: React.ReactNode;
}

const devtoolsFeatures: DevtoolsFeature[] = [
  {
    icon: Network,
    label: "Network",
    title: "Network Inspector",
    description: "Stream every request as it fires. Headers, payload, response, and per-phase timings.",
    link: "/docs/hyper-flow/features/network",
    visual: <NetworkLogVisual />,
  },
  {
    icon: Database,
    label: "Cache",
    title: "Cache Inspector",
    description: "Browse cached entries with hit rates, size, and last update. Drill into any key to debug stale data.",
    link: "/docs/hyper-flow/features/cache",
    visual: <CacheHitRateVisual />,
  },
  {
    icon: Workflow,
    label: "Queues",
    title: "Queue Manager",
    description: "Live view of every queue. Track pending, in-flight, and stuck requests across your app.",
    link: "/docs/hyper-flow/features/queues",
    visual: <QueueFlowVisual />,
  },
  {
    icon: Gauge,
    label: "Metrics",
    title: "Performance Dashboard",
    description:
      "Network, cache, and queue metrics in one view. Success rates, hit ratios, throughput, slow endpoints.",
    link: "/docs/hyper-flow/features/dashboard",
    visual: <MetricsSparklineVisual />,
  },
];

export function Preview(): React.JSX.Element {
  return (
    <>
      <section className="relative pb-20 pt-4 -z-10 group mb-28">
        {/* <Particles className="absolute inset-0 -z-10" /> */}

        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            viewport={{ once: true }}
          >
            <div>
              <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                Power up your development workflow
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Meet HyperFlow Devtools
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            viewport={{ once: true }}
          >
            <Description className="text-lg !text-zinc-400 mb-8">
              A standalone desktop app that plugs into your client. Inspect every request, cache entry, and queue as
              your app runs. Debug your data layer visually.
            </Description>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center">
              <Link
                className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
                to="/docs/hyper-flow/download"
              >
                Get Devtools Access
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 rounded-md overflow-hidden -mb-[20vh]">
              <div className="relative w-fit h-fit rounded-md overflow-hidden">
                <BorderBeam duration={8} size={500} />
                <BorderBeam duration={8} size={500} delay={4} />
                <img src={DashboardPreview} alt="preview" className="transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--background)] to-transparent from-5% to-20%" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature cards — emerge from the dashboard fade */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 mt-40 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {devtoolsFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              viewport={{ once: true, margin: "-40px" }}
              className={cn(
                "group/card relative h-full overflow-hidden rounded-2xl bg-zinc-900/80 bg-with-noise p-6 lg:p-7",
                "[border:1px_solid_rgba(255,255,255,.1)]",
                "[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
                "transition-colors duration-500",
              )}
            >
              <Noise visibility="medium" />
              <Link to={feature.link} className="!no-underline relative z-10 flex h-full flex-col">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  <feature.icon className="size-3.5" />
                  {feature.label}
                </span>
                <h4 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-100">{feature.title}</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{feature.description}</p>
                <div className="mt-5">{feature.visual}</div>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-medium text-zinc-500 transition-colors group-hover/card:text-zinc-300">
                  Open in docs
                  <ArrowRight className="size-3 transition-transform group-hover/card:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
