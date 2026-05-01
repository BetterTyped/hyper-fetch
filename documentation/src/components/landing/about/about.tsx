import { Description, Title } from "@site/src/components";
import { ArrowRight, Bot, CheckCircle2, Database, Layers, Repeat, WifiOff } from "lucide-react";
import { motion } from "motion/react";

const problems = [
  {
    icon: Layers,
    title: "Five libraries for one data flow",
    description:
      "Axios for fetching. React Query for caching. A custom hook for retries. Another package for WebSockets. Each with its own config and mental model.",
    solutionTitle: "One client replaces all of them",
    solutionDescription:
      "Fetch, cache, retry, queue, dedup, and offline replay. One import, one configuration surface, zero glue code between packages.",
  },
  {
    icon: Repeat,
    title: "Every endpoint is hand-written",
    description:
      "REST calls, socket listeners, Firebase queries. Each one gets its own wrapper, type definition, and error handler. Add a new endpoint, copy-paste the last one, tweak it.",
    solutionTitle: "SDK generated from your schema or types",
    solutionDescription:
      "Point at an OpenAPI spec or import types from your monorepo backend. HyperFetch generates a fully typed SDK for REST and Sockets. No hand-written wrappers.",
  },
  {
    icon: Database,
    title: "Cache shows stale data after mutations",
    description:
      "You update a record, but three other components still render the old version until someone refreshes the page. Rollbacks are manual. Nothing is type-checked.",
    solutionTitle: "Typed optimistic updates with automatic rollback",
    solutionDescription:
      "Mutate the UI instantly with fully typed cache updates. If the server rejects, HyperFetch rolls back automatically. WebSocket events can update REST cache in real time.",
  },
  {
    icon: WifiOff,
    title: "WebSockets break your patterns",
    description:
      "REST uses hooks and query clients. Sockets get a custom event system. Two separate data layers with different error handling.",
    solutionTitle: "Same mental model for realtime",
    solutionDescription:
      "WebSockets, SSE, and Firebase listeners follow the same typed request pattern. Shared lifecycle, shared retries, shared queue logic.",
  },
  {
    icon: Bot,
    title: "AI gets your API calls wrong",
    description:
      "LLMs guess at parameter names, payloads, and error shapes. Without typed contracts, every AI-generated API call is a coin flip.",
    solutionTitle: "Typed schemas AI can work with",
    solutionDescription:
      "Your SDK, types, and schemas give AI agents a complete contract for every endpoint. Code generation and agentic workflows become type-safe by default.",
  },
];

export const About = () => {
  return (
    <section className="relative overflow-hidden pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center pb-6 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div>
              <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                Why this exists
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Same bugs, different project
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Description className="text-lg !text-zinc-400">
              Apps break when cache, realtime events, retries, queues, and UI state each follow different rules in
              different libraries. HyperFetch puts them under one roof.
            </Description>
          </motion.div>
        </div>
        <div className="pb-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 lg:grid lg:grid-cols-[1fr_72px_1fr]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-400/50 lg:hidden" />
            Common problem
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 lg:justify-start">
            <span className="size-2 rounded-full bg-emerald-400/50 lg:hidden" />
            HyperFetch answer
          </div>
        </div>

        <div className="space-y-4">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            const isLast = index === problems.length - 1;

            return (
              <div key={problem.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.08 }}
                  viewport={{ once: true }}
                  className="grid gap-3 lg:grid-cols-[1fr_72px_1fr] lg:items-stretch"
                >
                  <div className="h-full rounded-2xl border border-rose-400/10 bg-rose-950/[0.08] p-5">
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-400/10">
                        <Icon className="size-5 text-rose-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold tracking-tight text-zinc-100">{problem.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{problem.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative hidden items-center justify-center lg:flex">
                    <ArrowRight className="size-5 text-zinc-500" />
                  </div>

                  <div className="h-full rounded-2xl border border-emerald-400/15 bg-emerald-950/[0.08] p-5">
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                        <CheckCircle2 className="size-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold tracking-tight text-zinc-100">{problem.solutionTitle}</h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{problem.solutionDescription}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {!isLast && (
                  <div className="flex items-center justify-center gap-1.5 py-4 lg:hidden">
                    <span className="size-1 rounded-full bg-zinc-600" />
                    <span className="size-1 rounded-full bg-zinc-700" />
                    <span className="size-1 rounded-full bg-zinc-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
