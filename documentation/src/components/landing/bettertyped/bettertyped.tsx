import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * BetterTyped proof, between "How it works" and "Same bugs": the family HyperFetch comes from and the
 * numbers behind every BetterTyped library. Same figures as the Hype Stack landing.
 */

const stats = [
  {
    value: "16.7M+",
    label: "downloads a month",
    note: "across every BetterTyped library",
  },
  {
    value: "3.3k+",
    label: "GitHub stars",
    note: "across every BetterTyped repo",
  },
  {
    value: "10 years",
    label: "of building open source",
    note: "and still shipping",
  },
];

const display = "[font-family:Figtree] font-extrabold tracking-[-0.05em]";

export const BetterTyped = () => (
  <section className="relative pb-20 pt-6 md:pb-28 md:pt-10">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeader className="mb-10 md:mb-12" title="Built by BetterTyped" />
      <motion.div
        {...fadeUp(0)}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <span className="flex items-center gap-3 text-base font-medium text-zinc-500">
          <img
            src="/img/team/logo-bettertyped.png"
            alt=""
            className="size-7 rounded-lg"
          />
          BetterTyped open source, the family HyperFetch comes from
        </span>
        <a
          href="https://bettertyped.com"
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold !text-yellow-300 !no-underline"
        >
          Meet BetterTyped
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </motion.div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp(i + 1)}
            className="relative overflow-hidden rounded-3xl bg-[#202023] px-7 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.07]"
          >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
            <div
              className={`bg-gradient-to-b from-[#ffe08a] to-[#f5a623] bg-clip-text pb-[0.14em] text-[clamp(2.75rem,5vw,4.75rem)] leading-none !text-transparent ${display}`}
            >
              {s.value}
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
              {s.label}
            </div>
            <div className="mt-1 text-[15px] text-zinc-500">{s.note}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
