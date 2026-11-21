import { Particles } from "@site/src/components";
import { Star } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { SectionHeader, fadeUp } from "../shared/section-header";
import { CtaButtons } from "../shared/skills-command";
import { useHfMonthlyDownloads } from "../shared/use-hf-downloads";

/*
 * Final call to action: the standard section head, the same two actions as the hero and the
 * open-source numbers, with downloads summed live from npm.
 */

const TITLE = "Fetch anything. Type everything.";
const LINE = "Every protocol. Every framework. Ready for your AI agent.";

/* Downloads are every HyperFetch package, live from npm, same set as the README badge */
const useProof = () => {
  const downloads = useHfMonthlyDownloads();
  return [
    { value: "MIT", label: "Open source" },
    { value: "1.3k", label: "GitHub stars", star: true },
    { value: downloads, label: "Downloads a month" },
  ];
};

/* Centered head, the two hero actions, then the open-source numbers */
export const CallToAction = () => {
  const proof = useProof();
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-12">
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 aspect-square w-[560px] max-w-[90vw] -translate-x-1/2 -translate-y-[74%]"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-full bg-yellow-500 opacity-40 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 size-1/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 opacity-60 blur-[40px]" />
      </div>
      <Particles className="absolute inset-0 -z-10" quantity={40} />
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeader
          className="mb-0 md:mb-0"
          eyebrow="Start building"
          title={TITLE}
          description={LINE}
        />
        <motion.div {...fadeUp(3)} className="mx-auto mt-10 flex w-full max-w-[400px] justify-center sm:w-auto sm:max-w-none">
          <CtaButtons />
        </motion.div>
        <div className="mt-16 grid grid-cols-3 gap-6 sm:gap-10">
          {proof.map((p, i) => (
            <motion.div
              key={p.label}
              {...fadeUp(4 + i)}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 bg-gradient-to-b from-[#ffe08a] to-[#f5a623] bg-clip-text text-4xl font-extrabold pb-[0.14em] leading-none tracking-[-0.04em] !text-transparent [font-family:Figtree] md:text-5xl">
                {p.star && (
                  <Star className="size-6 fill-[#fbc646] text-[#fbc646] md:size-7" />
                )}
                {p.value}
              </div>
              <div className="mt-3 text-[13px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                {p.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
