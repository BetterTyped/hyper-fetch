import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import {
  ArrowRight,
  Braces,
  Check,
  Database,
  Download,
  Laptop,
  PenLine,
  Power,
  X,
  Zap,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { BentoCard, BentoGrid } from "../shared/bento-card";
import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * "Everything is JSON": persistence, between the production bento and "Same bugs". Two parts, each a pair of cards
 * playing three steps side by side. Requests: offline only (queued, app closed, lost) against persisted (queued,
 * saved as JSON, synced). Cache and DB: a cached response and an offline write, both saved as JSON and back on the
 * next start. A slim strip under them links the DB package.
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

const cached: Node[] = [
  { icon: Download, label: "Fetched", tone: "neutral" },
  { icon: Braces, label: "Saved as JSON", tone: "honey" },
  { icon: Zap, label: "Instant reload", tone: "emerald" },
];

const outbox: Node[] = [
  { icon: PenLine, label: "Offline write", tone: "neutral" },
  { icon: Braces, label: "Outbox as JSON", tone: "honey" },
  { icon: Check, label: "Replayed", tone: "emerald" },
];

/* The head of one part: its number in gold, a short title and one line */
const PartHead = ({
  n,
  title,
  line,
  className,
}: {
  n: string;
  title: string;
  line: string;
  className?: string;
}) => (
  <motion.div
    {...fadeUp(0)}
    className={cn(
      "mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6",
      className,
    )}
  >
    <span className="flex items-baseline gap-3">
      <span className="bt-gold-text font-mono text-[12px] font-semibold">
        {n}
      </span>
      <span className="text-[20px] font-bold tracking-tight text-zinc-100">
        {title}
      </span>
    </span>
    <span className="text-[15px] text-zinc-500">{line}</span>
  </motion.div>
);

/* Two cards that play their steps together while on screen */
const Pair = ({
  left,
  right,
}: {
  left: { title: string; line: string; nodes: Node[] };
  right: { title: string; line: string; nodes: Node[] };
}) => {
  const { ref, step } = useStep();
  return (
    <div ref={ref}>
      <BentoGrid className="md:grid-cols-2">
        <BentoCard
          title={left.title}
          visualClassName="flex-none"
          line={left.line}
        >
          <Flow nodes={left.nodes} step={step} />
        </BentoCard>
        <BentoCard
          i={1}
          title={right.title}
          visualClassName="flex-none"
          line={right.line}
        >
          <Flow nodes={right.nodes} step={step} />
        </BentoCard>
      </BentoGrid>
    </div>
  );
};

export const Persistence = () => (
  <section className="relative">
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 md:pb-20">
      <SectionHeader
        eyebrow="Persistence"
        title="Everything is JSON"
        description="Requests, cache and queues save as plain JSON. Close the app. Pick up where you left off."
      />
      <div className="landing-scope">
        <PartHead
          n="01"
          title="Requests"
          line="The queue survives a restart."
        />
        <Pair
          left={{
            title: "Offline",
            line: "Requests wait in memory. Close the app and they are gone.",
            nodes: offline,
          }}
          right={{
            title: "Persisted",
            line: "Requests wait in storage. They send on the next start.",
            nodes: persisted,
          }}
        />

        <PartHead
          n="02"
          title="Cache and DB"
          line="Your data is there before the first request."
          className="mt-14"
        />
        <Pair
          left={{
            title: "Cache",
            line: "Responses persist to IndexedDB or any storage. A reload renders from cache.",
            nodes: cached,
          }}
          right={{
            title: "DB",
            line: "Collections and their offline outbox persist. Writes replay in order.",
            nodes: outbox,
          }}
        />
        <motion.div {...fadeUp(2)} className="mt-4">
          <Link
            to="/docs/db/overview"
            className="group flex flex-col items-start gap-3 rounded-3xl bg-[#1f1f21] px-7 py-5 !no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-[#232325] sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="flex shrink-0 items-center gap-2.5">
              <Database className="size-5 text-[#fbc646]" strokeWidth={1.75} />
              <span className="font-mono text-[14px] text-zinc-100">
                @hyper-fetch/db
              </span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                New
              </span>
            </span>
            <span className="flex-1 text-[15px] text-zinc-400">
              Live collections fed by your requests and sockets. One source of
              truth for every view.
            </span>
            <ArrowRight
              className="hidden size-4 shrink-0 text-zinc-500 transition-all group-hover:translate-x-0.5 group-hover:text-[#fbc646] sm:block"
              aria-hidden
            />
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);
