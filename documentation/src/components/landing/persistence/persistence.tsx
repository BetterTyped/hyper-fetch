import { cn } from "@site/src/lib/utils";
import { Braces, Check, Database, Laptop, Power, X } from "lucide-react";
import { motion, useInView } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { BentoCard, BentoGrid } from "../shared/bento-card";
import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * "Everything is JSON": persistence, between the production bento and "Same bugs".
 * Two cards play the same three steps side by side. Offline only: queued, app closed, lost.
 * Persisted: queued, saved as JSON, synced. A slim strip under them points to the DB package.
 */

const STEPS = 3;

/* The step both cards are on: 0..2, then a short hold on the result */
const useStep = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(() => setTick((s) => (s + 1) % (STEPS + 2)), 1000);
    return () => clearTimeout(t);
  }, [inView, tick]);
  return { ref, step: Math.min(tick, STEPS - 1) };
};

type Tone = "neutral" | "honey" | "rose" | "emerald";

const tones: Record<Tone, string> = {
  neutral: "text-zinc-300",
  honey: "text-[#fbc646]",
  rose: "text-rose-400",
  emerald: "text-emerald-300",
};

const rings: Record<Tone, string> = {
  neutral: "ring-white/20",
  honey: "ring-[#fbc646]/50 shadow-[0_0_30px_-8px_rgba(251,198,70,0.6)]",
  rose: "ring-rose-500/50 shadow-[0_0_30px_-8px_rgba(244,63,94,0.6)]",
  emerald: "ring-emerald-400/50 shadow-[0_0_30px_-8px_rgba(52,211,153,0.6)]",
};

type Node = { icon: React.ElementType; label: string; tone: Tone };

const Step = ({
  node,
  on,
  done,
}: {
  node: Node;
  on: boolean;
  done: boolean;
}) => {
  const Icon = node.icon;
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-3">
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl bg-[#2a2a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset transition-all duration-300",
          on ? rings[node.tone] : "ring-white/[0.06]",
        )}
      >
        <Icon
          className={cn(
            "size-7 transition-colors duration-300",
            on || done ? tones[node.tone] : "text-zinc-600",
          )}
          strokeWidth={1.75}
        />
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-[13px] font-medium transition-colors duration-300",
          on ? "text-zinc-100" : "text-zinc-500",
        )}
      >
        {node.label}
      </span>
    </div>
  );
};

/* The dashed line between two steps, with a dot running along it when the next step starts */
const Connector = ({ active }: { active: boolean }) => (
  <div className="relative mb-8 h-px flex-1 border-0 border-t border-dashed border-white/15">
    {active && (
      <motion.span
        className="absolute -top-[3px] size-[5px] rounded-full bg-yellow-300 shadow-[0_0_8px_2px_rgba(250,204,21,0.6)]"
        initial={{ left: "0%", opacity: 0 }}
        animate={{ left: "100%", opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    )}
  </div>
);

const Flow = ({ nodes, step }: { nodes: Node[]; step: number }) => (
  <div className="flex h-full h-[200px] items-center px-7 pt-8 sm:px-10">
    {nodes.map((n, i) => (
      <React.Fragment key={n.label}>
        {i > 0 && <Connector key={`l-${step === i}`} active={step === i} />}
        <Step node={n} on={step === i} done={step > i} />
      </React.Fragment>
    ))}
  </div>
);

const offline: Node[] = [
  { icon: Laptop, label: "3 queued", tone: "neutral" },
  { icon: Power, label: "App closed", tone: "neutral" },
  { icon: X, label: "Lost", tone: "rose" },
];

const persisted: Node[] = [
  { icon: Laptop, label: "3 queued", tone: "neutral" },
  { icon: Braces, label: "Saved as JSON", tone: "honey" },
  { icon: Check, label: "Synced", tone: "emerald" },
];

export const Persistence = () => {
  const { ref, step } = useStep();
  return (
    <section className="relative">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 md:pb-20">
        <SectionHeader
          eyebrow="Persistence"
          title="Everything is JSON"
          description="Requests, cache and queues save as plain JSON. Close the app. Pick up where you left off."
        />
        <div ref={ref} className="landing-scope">
          <BentoGrid className="md:grid-cols-2">
            <BentoCard
              title="Offline"
              visualClassName="flex-none"
              line="Requests wait in memory. Close the app and they are gone."
            >
              <Flow nodes={offline} step={step} />
            </BentoCard>
            <BentoCard
              i={1}
              title="Persisted"
              visualClassName="flex-none"
              line="Requests wait in storage. They send on the next start."
            >
              <Flow nodes={persisted} step={step} />
            </BentoCard>
          </BentoGrid>
          <motion.div
            {...fadeUp(2)}
            className="mt-4 flex flex-col items-start gap-3 rounded-3xl bg-[#1f1f21] px-7 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="flex shrink-0 items-center gap-2.5">
              <Database className="size-5 text-[#fbc646]" strokeWidth={1.75} />
              <span className="font-mono text-[14px] text-zinc-100">
                @hyper-fetch/db
              </span>
              <span className="rounded-full bg-[#fbc646]/10 px-2 py-0.5 text-[11px] font-medium text-[#fbc646]">
                Soon
              </span>
            </span>
            <span className="text-[15px] text-zinc-400">
              Offline-first apps that sync when you are back online. No database
              in the browser.
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
