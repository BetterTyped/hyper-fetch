import { cn } from "@site/src/lib/utils";
import {
  Boxes,
  Check,
  Database,
  FileCode2,
  MousePointerClick,
  Radio,
  RefreshCw,
  Send,
  Server,
  Table2,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { BentoCard, BentoGrid } from "../shared/bento-card";
import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * "What is HyperFetch": Core / Sockets / DB tabs, each with five cards in the Hype Stack layout.
 * Illustrations are calm and simple: raised cards with an icon, a name and a short label,
 * a gentle entrance and at most one subtle highlight.
 */

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const useTick = (n: number, ms: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const id = setTimeout(() => setT((x) => (x + 1) % n), ms);
    return () => clearTimeout(id);
  }, [inView, t, n, ms]);
  return { ref, t };
};

const raised =
  "rounded-2xl bg-[#2a2a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_36px_-18px_rgba(0,0,0,0.85)] ring-1 ring-inset ring-white/[0.06]";

const enter = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -40px 0px" },
  transition: { duration: 0.4, delay: 0.1 + i * 0.08, ease },
});

/* ── Building blocks ──────────────────────────────────────────────────────────────────── */

/* A slightly tilted stack of named cards, each with an icon and a short label */
const Stack = ({
  icon: Icon,
  items,
}: {
  icon: React.ElementType;
  items: { name: string; label: string }[];
}) => {
  const tilt = [
    { rotate: -2, x: 0 },
    { rotate: 1.5, x: 26 },
    { rotate: -1, x: 8 },
  ];
  return (
    <div className="flex h-full items-center rounded-2xl bg-gradient-to-br from-white/[0.035] to-transparent px-5 py-7 ring-1 ring-inset ring-white/[0.04]">
      <div className="flex w-full flex-col gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.name}
            initial={{ opacity: 0, y: 12, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt[i].rotate }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.1, ease }}
            className={cn(raised, "flex w-[86%] items-start gap-3 px-4 py-3")}
            style={{ marginLeft: tilt[i].x }}
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-[#fbc646]" />
            <div>
              <div className="text-[15px] font-semibold text-zinc-100">
                {it.name}
              </div>
              <div className="text-[13px] text-zinc-500">{it.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* A checklist: check, name, a short value on the right */
const Checklist = ({ items }: { items: { name: string; value: string }[] }) => (
  <div className="flex h-full flex-col justify-end gap-2">
    {items.map((it, i) => (
      <motion.div
        key={it.name}
        {...enter(i)}
        className={cn(raised, "flex items-center gap-3 px-4 py-2.5")}
      >
        <Check className="size-4 text-emerald-400" />
        <span className="flex-1 text-[15px] font-semibold text-zinc-100">
          {it.name}
        </span>
        <span className="bt-gold-text font-mono text-[13px] font-semibold">
          {it.value}
        </span>
      </motion.div>
    ))}
  </div>
);

/* Name on the left, a green answer chip on the right */
const Answers = ({ items }: { items: { name: string; value: string }[] }) => (
  <div className="flex h-full flex-col justify-end">
    {items.map((it, i) => (
      <motion.div
        key={it.name}
        {...enter(i)}
        className="flex items-center justify-between gap-3 border-0 border-b border-solid border-white/[0.06] py-3 last:border-b-0"
      >
        <span className="text-[15px] text-zinc-400">{it.name}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[13px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
          <Check className="size-3.5" /> {it.value}
        </span>
      </motion.div>
    ))}
  </div>
);

/* Logo tiles, one gently highlighted at a time */
const Tiles = ({ items }: { items: { id?: string; text?: string }[] }) => {
  const { ref, t } = useTick(items.length, 1500);
  return (
    <div ref={ref} className="flex h-full items-end">
      <div className="grid w-full grid-cols-4 gap-2.5">
        {items.map((it, i) => (
          <span
            key={it.id ?? it.text}
            className={cn(
              raised,
              "flex aspect-square items-center justify-center transition-all duration-500",
              i === t &&
                "ring-[#fbc646]/45 shadow-[0_0_28px_-8px_rgba(251,198,70,0.55)]",
            )}
          >
            {it.id ? (
              <img
                src={`/img/integration-${it.id}.svg`}
                alt=""
                className={cn(
                  "size-7 object-contain transition-opacity duration-500",
                  i === t ? "opacity-100" : "opacity-50",
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-[14px] font-bold transition-colors duration-500",
                  i === t ? "text-zinc-100" : "text-zinc-500",
                )}
              >
                {it.text}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

/* Two boxes and what happens between them */
const Flow = ({
  from,
  to,
  mark,
}: {
  from: { icon: React.ElementType; label: string };
  to: { icon: React.ElementType; label: string };
  mark: {
    tone: "rose" | "amber" | "emerald";
    icon: React.ElementType;
    label: string;
  };
}) => (
  <div className="flex h-full items-end">
    <div className="flex w-full items-center gap-2">
      <motion.div
        {...enter(0)}
        className={cn(
          raised,
          "flex w-[32%] flex-col items-center gap-2 px-2 py-4",
        )}
      >
        <from.icon className="size-5 text-zinc-300" />
        <span className="text-[13px] font-semibold text-zinc-200">
          {from.label}
        </span>
      </motion.div>
      <div className="relative flex flex-1 flex-col items-center">
        <span className="absolute inset-x-0 top-[18px] h-px border-0 border-t border-dashed border-white/15" />
        <motion.span
          {...enter(1)}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full ring-4",
            mark.tone === "rose" && "bg-rose-500 ring-rose-500/20",
            mark.tone === "amber" && "bg-[#fbc646] ring-[#fbc646]/20",
            mark.tone === "emerald" && "bg-emerald-500 ring-emerald-500/20",
          )}
        >
          <mark.icon
            className={cn(
              "size-4",
              mark.tone === "amber" ? "text-zinc-900" : "text-white",
            )}
          />
        </motion.span>
        <span
          className={cn(
            "mt-2 whitespace-nowrap text-[12px] font-semibold",
            mark.tone === "rose" && "text-rose-300",
            mark.tone === "amber" && "text-[#fbc646]",
            mark.tone === "emerald" && "text-emerald-300",
          )}
        >
          {mark.label}
        </span>
      </div>
      <motion.div
        {...enter(2)}
        className={cn(
          raised,
          "flex w-[32%] flex-col items-center gap-2 px-2 py-4",
        )}
      >
        <to.icon className="size-5 text-zinc-300" />
        <span className="text-[13px] font-semibold text-zinc-200">
          {to.label}
        </span>
      </motion.div>
    </div>
  </div>
);

/*
 * One field renamed on the backend. The request and the screen that still read the old name stop compiling,
 * with the red squiggle under it, then follow the rename. It flips the name back and forth while on screen,
 * so every pass is a real rename. Reduced motion shows the broken state, which is the point.
 */
const RENAME_PHASES = [
  { name: 0, broken: false, ms: 1500 },
  { name: 1, broken: true, ms: 2300 },
  { name: 1, broken: false, ms: 1500 },
  { name: 0, broken: true, ms: 2300 },
] as const;
const FIELD_NAMES = ["name", "fullName"] as const;
const CHAIN = [
  { layer: "Backend", before: "", after: ": string", source: true },
  { layer: "Request", before: "data.", after: "", source: false },
  { layer: "Screen", before: "<p>{user.", after: "}</p>", source: false },
] as const;

const TypeChain = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    const id = setTimeout(
      () => setPhase((p) => (p + 1) % RENAME_PHASES.length),
      RENAME_PHASES[phase].ms,
    );
    return () => clearTimeout(id);
  }, [inView, reduceMotion, phase]);

  const current = reduceMotion ? RENAME_PHASES[1] : RENAME_PHASES[phase];
  const renamed = FIELD_NAMES[current.name];
  const stale = FIELD_NAMES[1 - current.name];

  return (
    <div ref={ref} className="flex h-full flex-col justify-end gap-1.5">
      {CHAIN.map((link, i) => {
        const broken = current.broken && !link.source;
        const field = broken ? stale : renamed;
        return (
          <motion.div
            key={link.layer}
            {...enter(i)}
            className={cn(
              raised,
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-shadow duration-300",
              broken &&
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_-10px_rgba(244,63,94,0.55)]",
            )}
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <span className="w-[58px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {link.layer}
            </span>
            <code className="min-w-0 flex-1 truncate !border-0 !bg-transparent !p-0 font-mono !text-[13px] !text-zinc-400">
              {link.before}
              <span
                className={cn(
                  "rounded px-1 py-px transition-colors duration-300",
                  broken
                    ? "bg-rose-500/15 !text-rose-300 underline decoration-[#f43f5e] decoration-wavy underline-offset-[3px]"
                    : "bg-[#fbc646]/10 !text-[#fbc646]",
                )}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={field}
                    className="inline-block"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, delay: i * 0.09, ease }}
                  >
                    {field}
                  </motion.span>
                </AnimatePresence>
              </span>
              {link.after}
            </code>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                broken
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-emerald-400/10 text-emerald-400",
              )}
              style={{ transitionDelay: `${i * 90}ms` }}
              aria-label={
                broken
                  ? `${link.layer} stops compiling`
                  : `${link.layer} compiles`
              }
            >
              {broken ? (
                <X className="size-3.5" strokeWidth={2.75} />
              ) : (
                <Check className="size-3.5" strokeWidth={2.75} />
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ── Tabs: Core, Sockets, DB ──────────────────────────────────────────────────────────── */
const tabs = [
  { key: "core", icon: Boxes, name: "Core" },
  { key: "sockets", icon: Radio, name: "Sockets" },
  { key: "db", icon: Database, name: "DB" },
] as const;

const CoreCards = () => (
  <>
    <BentoCard
      n="01"
      split
      i={0}
      className="lg:col-span-7"
      title="Request"
      line="Describe each endpoint once. Fully typed."
      visualClassName="lg:h-[290px]"
    >
      <Stack
        icon={FileCode2}
        items={[
          { name: "getUser", label: "Returns a User" },
          { name: "createUser", label: "Takes a typed payload" },
          { name: "getPosts", label: "Returns Post[]" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="02"
      i={1}
      className="lg:col-span-5"
      title="Engine"
      line="Cache, dedupe, retries and offline. Built in."
      visualClassName="h-[220px]"
    >
      <Checklist
        items={[
          { name: "Cache", value: "0 ms" },
          { name: "Dedupe", value: "1 call" },
          { name: "Retry", value: "auto" },
          { name: "Offline", value: "queued" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="03"
      i={2}
      className="lg:col-span-4"
      title="Fetcher"
      line="Swap the protocol. Keep your code."
      visualClassName="h-[150px]"
    >
      <Tiles
        items={[
          { id: "rest" },
          { id: "graphql" },
          { id: "firebase" },
          { id: "axios" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="04"
      i={3}
      className="lg:col-span-4"
      title="Typed response"
      line="Data or error. Never throws."
      visualClassName="h-[150px]"
    >
      <Answers
        items={[
          { name: "data", value: "User" },
          { name: "error", value: "Typed" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="05"
      i={4}
      className="lg:col-span-4"
      title="Breaks in your editor"
      line="Not in production."
      visualClassName="h-[150px]"
    >
      <TypeChain />
    </BentoCard>
  </>
);

const SocketsCards = () => (
  <>
    <BentoCard
      n="01"
      split
      i={0}
      className="lg:col-span-7"
      title="Listener"
      line="Subscribe to a topic. Typed messages."
      visualClassName="lg:h-[290px]"
    >
      <Stack
        icon={Radio}
        items={[
          { name: "onChatMessage", label: "Receives a Message" },
          { name: "onPresence", label: "Receives Presence" },
          { name: "onNotification", label: "Receives a Notice" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="02"
      i={1}
      className="lg:col-span-5"
      title="Emitter"
      line="Send typed events."
      visualClassName="h-[220px]"
    >
      <Checklist
        items={[
          { name: "sendChatMessage", value: "sent" },
          { name: "sendTyping", value: "sent" },
          { name: "joinRoom", value: "sent" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="03"
      i={2}
      className="lg:col-span-4"
      title="Transport"
      line="WebSocket, SSE, Firebase or GraphQL."
      visualClassName="h-[150px]"
    >
      <Tiles
        items={[
          { id: "sockets" },
          { id: "sse" },
          { id: "firebase" },
          { id: "graphql" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="04"
      i={3}
      className="lg:col-span-4"
      title="Reconnects"
      line="Drops? It comes back on its own."
      visualClassName="h-[150px]"
    >
      <Flow
        from={{ icon: WifiOff, label: "Lost" }}
        to={{ icon: Wifi, label: "Online" }}
        mark={{ tone: "amber", icon: RefreshCw, label: "Reconnecting" }}
      />
    </BentoCard>
    <BentoCard
      n="05"
      i={4}
      className="lg:col-span-4"
      title="Same model"
      line="Requests and realtime, one API."
      visualClassName="h-[150px]"
    >
      <Answers
        items={[
          { name: "send()", value: "User" },
          { name: "listen()", value: "Message" },
        ]}
      />
    </BentoCard>
  </>
);

const DbCards = () => (
  <>
    <BentoCard
      n="01"
      split
      i={0}
      className="lg:col-span-7"
      title="Collections"
      line="Each row lives once. Every query reads it."
      visualClassName="lg:h-[290px]"
    >
      <Stack
        icon={Table2}
        items={[
          { name: "posts", label: "Typed rows by id" },
          { name: "users", label: "Joined to posts" },
          { name: "comments", label: "Loaded per post" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="02"
      i={1}
      className="lg:col-span-5"
      title="Live queries"
      line="The server filters what it can. Memory does the rest."
      visualClassName="h-[220px]"
    >
      <Checklist
        items={[
          { name: "teamId = 1", value: "server" },
          { name: "likes > 10", value: "local" },
          { name: "Newest first", value: "server" },
          { name: "Socket update", value: "live" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="03"
      i={2}
      className="lg:col-span-4"
      title="Any source"
      line="REST, GraphQL, Firebase or sockets."
      visualClassName="h-[150px]"
    >
      <Tiles
        items={[
          { id: "rest" },
          { id: "graphql" },
          { id: "firebase" },
          { id: "sockets" },
        ]}
      />
    </BentoCard>
    <BentoCard
      n="04"
      i={3}
      className="lg:col-span-4"
      title="Optimistic"
      line="The change shows before the server answers."
      visualClassName="h-[150px]"
    >
      <Flow
        from={{ icon: MousePointerClick, label: "Write" }}
        to={{ icon: Server, label: "Server" }}
        mark={{ tone: "emerald", icon: Zap, label: "Shown now" }}
      />
    </BentoCard>
    <BentoCard
      n="05"
      i={4}
      className="lg:col-span-4"
      title="Offline"
      line="Writes wait for the network."
      visualClassName="h-[150px]"
    >
      <Answers
        items={[
          { name: "insert()", value: "Queued" },
          { name: "Back online", value: "Replayed" },
        ]}
      />
    </BentoCard>
  </>
);

export const WhatIs = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("core");
  return (
    <section className="relative pb-20 pt-12 md:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            align="left"
            className="mb-0 md:mb-0"
            eyebrow="What is HyperFetch"
            title="One framework, three parts"
          />
          <motion.div
            {...fadeUp(2)}
            className="flex flex-wrap items-center gap-2"
            role="tablist"
          >
            {tabs.map((p) => {
              const on = tab === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(p.key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border-0 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-inset transition-all duration-200",
                    on
                      ? "bg-[#26262a] ring-[#fbc646]/50 shadow-[0_0_30px_-10px_rgba(251,198,70,0.5)]"
                      : "bg-[#1f1f21] ring-white/[0.07] hover:ring-white/20",
                  )}
                >
                  <p.icon
                    className={cn(
                      "size-5",
                      on ? "text-[#fbc646]" : "text-zinc-500",
                    )}
                    strokeWidth={1.75}
                  />
                  <span
                    className={cn(
                      "text-[16px] font-semibold",
                      on ? "text-zinc-100" : "text-zinc-400",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease }}
          >
            <BentoGrid className="grid-cols-1 lg:grid-cols-12">
              {tab === "core" && <CoreCards />}
              {tab === "sockets" && <SocketsCards />}
              {tab === "db" && <DbCards />}
            </BentoGrid>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
