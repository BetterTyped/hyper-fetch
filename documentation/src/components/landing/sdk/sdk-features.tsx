import { Activity, Code2, Globe, Layers3, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { fadeUp } from "../shared/section-header";

/* The six features under the SDK cards: a lit icon tile, a title and one line each */

interface SdkFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const features: SdkFeature[] = [
  {
    icon: Shield,
    title: "End-to-end TypeScript",
    description:
      "Params inferred from the URL. Typed payloads, responses and errors.",
  },
  {
    icon: Code2,
    title: "React hooks built in",
    description:
      "useFetch for queries. useSubmit for mutations. States handled.",
  },
  {
    icon: Activity,
    title: "HyperFlow devtools",
    description: "Inspect every request, cache entry and queue.",
  },
  {
    icon: Globe,
    title: "Runs everywhere",
    description: "Browser, Node, edge, mobile and SSR. Same behavior.",
  },
  {
    icon: Zap,
    title: "Optimistic updates",
    description: "Update the UI first. Roll back if the server says no.",
  },
  {
    icon: Layers3,
    title: "Smart deduplication",
    description: "Five components ask for the same data. One request fires.",
  },
];

export const SdkFeatures = () => (
  <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
    {features.map((f, i) => (
      <motion.div key={f.title} {...fadeUp(i)} className="group flex gap-4">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-solid border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors duration-300 group-hover:border-yellow-400/40">
          <span className="absolute inset-0 rounded-2xl bg-yellow-400/0 blur-md transition-colors duration-300 group-hover:bg-yellow-400/15" />
          <f.icon className="relative size-5 text-yellow-400" />
        </span>
        <div>
          <h4 className="!m-0 text-xl font-extrabold tracking-tight text-zinc-100">
            {f.title}
          </h4>
          <p className="!mb-0 !mt-1.5 text-[15px] leading-relaxed text-zinc-400">
            {f.description}
          </p>
        </div>
      </motion.div>
    ))}
  </div>
);
