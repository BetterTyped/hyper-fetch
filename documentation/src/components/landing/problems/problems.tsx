import { cn } from "@site/src/lib/utils";
import { CircleCheck, CircleDot } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * "Same bugs, different project" as an issue tracker. Six bugs every team has filed show up open,
 * then HyperFetch closes them one by one. The issue titles are the only text.
 */

const issues = [
  {
    n: 1284,
    title: "Profile still shows the old name after save",
    fix: "Optimistic updates",
  },
  {
    n: 1291,
    title: "TypeError: Cannot read properties of undefined (reading 'email')",
    fix: "Typed responses",
  },
  {
    n: 1302,
    title: "Chat drops messages after reconnect",
    fix: "Realtime listeners",
  },
  {
    n: 1317,
    title: "Orders lost while the user was offline",
    fix: "Offline replay",
  },
  {
    n: 1325,
    title: "Agent called /api/user. The route is /users/:userId",
    fix: "Typed contracts",
  },
  {
    n: 1331,
    title: "Dashboard fires the same request five times",
    fix: "Deduplication",
  },
];

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export const Problems = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -200px 0px" });
  const [closed, setClosed] = useState(0);
  const [run, setRun] = useState(0);

  /* Loops: close the issues one by one, hold on "all closed", then reopen and start again */
  useEffect(() => {
    if (!inView) return undefined;
    if (closed >= issues.length) {
      const t = setTimeout(() => {
        setClosed(0);
        setRun((r) => r + 1);
      }, 3200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setClosed((c) => c + 1),
      closed === 0 ? 1100 : 520,
    );
    return () => clearTimeout(t);
  }, [inView, closed, run]);

  const open = issues.length - closed;

  return (
    <section className="relative pb-24 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="Why this exists"
          title="Same bugs, different projects"
          description="Every team files these. HyperFetch closes them."
        />

        <motion.div
          ref={ref}
          {...fadeUp(1)}
          className="relative mx-auto max-w-5xl"
        >
          {/* Bezel, same as the product video */}
          <div className="relative rounded-[22px] bg-zinc-900/70 p-2 shadow-[0_-1px_#ffdbdf2f,0_0_0_1px_#ffffff14,0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-lg md:p-2.5">
            <div className="pointer-events-none absolute inset-x-[12%] -top-px h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />
            <div className="overflow-hidden rounded-[14px] border border-solid border-black/60 bg-[#0f0f11]">
              {/* Tracker header */}
              <div className="flex h-14 items-center gap-6 border-0 border-b border-solid border-white/[0.06] bg-white/[0.02] px-5 text-sm">
                <span
                  className={cn(
                    "flex items-center gap-2 font-semibold transition-colors",
                    open ? "text-zinc-100" : "text-zinc-500",
                  )}
                >
                  <CircleDot className="size-4 text-emerald-400" />
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={open}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="tabular-nums"
                    >
                      {open}
                    </motion.span>
                  </AnimatePresence>
                  Open
                </span>
                <span
                  className={cn(
                    "flex items-center gap-2 font-semibold transition-colors",
                    open ? "text-zinc-500" : "text-zinc-100",
                  )}
                >
                  <CircleCheck className="size-4 text-violet-400" />
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={closed}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="tabular-nums"
                    >
                      {closed}
                    </motion.span>
                  </AnimatePresence>
                  Closed
                </span>
              </div>

              {/* Issues */}
              <ul className="!m-0 list-none !p-0">
                {issues.map((issue, i) => {
                  const done = i < closed;
                  return (
                    <li
                      key={issue.n}
                      className="relative !m-0 flex items-center gap-4 overflow-hidden border-0 border-b border-solid border-white/[0.05] px-5 py-4 last:border-b-0"
                    >
                      {/* Light sweep the moment the issue closes */}
                      <AnimatePresence>
                        {done && (
                          <motion.span
                            key={`sweep-${run}`}
                            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-yellow-300/[0.12] to-transparent"
                            initial={{ left: "-35%" }}
                            animate={{ left: "110%" }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          />
                        )}
                      </AnimatePresence>

                      <span className="relative size-5 shrink-0">
                        <motion.span
                          className="absolute inset-0"
                          initial={false}
                          animate={
                            done
                              ? { scale: 0.4, opacity: 0, rotate: -90 }
                              : { scale: 1, opacity: 1, rotate: 0 }
                          }
                          transition={{ duration: 0.22, ease }}
                        >
                          <CircleDot className="size-5 text-emerald-400" />
                        </motion.span>
                        <motion.span
                          className="absolute inset-0"
                          initial={false}
                          animate={
                            done
                              ? { scale: 1, opacity: 1, rotate: 0 }
                              : { scale: 0.4, opacity: 0, rotate: 90 }
                          }
                          transition={{
                            duration: 0.3,
                            delay: done ? 0.08 : 0,
                            ease,
                          }}
                        >
                          <CircleCheck className="size-5 text-violet-400" />
                        </motion.span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[15px] font-semibold tracking-tight transition-colors duration-500 md:text-base",
                            done ? "text-zinc-500" : "text-zinc-100",
                          )}
                        >
                          {issue.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                          <span className="font-mono">#{issue.n}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-px text-[11px] font-medium transition-colors duration-500",
                              done
                                ? "bg-white/[0.04] text-zinc-500"
                                : "bg-rose-500/15 text-rose-300",
                            )}
                          >
                            bug
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {done && (
                          <motion.span
                            key={`fix-${run}`}
                            initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.35, delay: 0.1, ease }}
                            className="hidden shrink-0 items-center gap-2 rounded-full border border-solid border-yellow-400/25 bg-yellow-400/[0.07] py-1 pl-1.5 pr-3 text-xs font-semibold text-yellow-200 sm:flex"
                          >
                            <img
                              src="/img/integration-hyper-fetch.svg"
                              alt=""
                              className="size-4"
                            />
                            {issue.fix}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
