import { Description, Title } from "@site/src/components";
import { ArrowRight, Bot, CheckCircle2, Database, Layers, Repeat, WifiOff } from "lucide-react";
import { motion } from "motion/react";

const problems = [
  {
    icon: Bot,
    title: "AI needs predictable APIs",
    description: "LLMs struggle when every endpoint, SDK, and data flow follows a different shape.",
    solutionTitle: "A standard interface for AI",
    solutionDescription:
      "HyperFetch gives AI tools one typed pattern to understand, generate, and use across your app.",
  },
  {
    icon: Layers,
    title: "Too many data tools",
    description: "Fetching, caching, realtime updates, queues, and state sync live in different libraries.",
    solutionTitle: "One data layer",
    solutionDescription: "Requests, cache, realtime events, queues, and offline replay run through the same client.",
  },
  {
    icon: Database,
    title: "State gets out of sync",
    description: "Requests, cache, optimistic updates, and subscriptions all need to agree.",
    solutionTitle: "Shared lifecycle",
    solutionDescription:
      "The same request lifecycle updates cache, React state, and subscriptions without extra glue code.",
  },
  {
    icon: WifiOff,
    title: "Realtime adds pressure",
    description: "WebSockets and subscriptions need lifecycle control, retries, and predictable cleanup.",
    solutionTitle: "Realtime with control",
    solutionDescription: "Sockets and subscriptions use the same lifecycle tools as regular requests.",
  },
  {
    icon: Repeat,
    title: "The setup keeps growing",
    description: "Each new API pattern adds another wrapper, hook, or convention.",
    solutionTitle: "One pattern keeps working",
    solutionDescription: "REST, GraphQL, Firebase, WebSockets, and SSE keep the same typed request API.",
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
                Data problems, solved
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
              Data chaos? Under control.
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Description className="text-lg !text-zinc-400">
              Apps do not break because fetching is hard. They break when cache, realtime events, retries, queues, and
              UI state all follow different rules.
            </Description>
          </motion.div>
        </div>
        <div className="hidden pb-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 lg:grid lg:grid-cols-[1fr_72px_1fr]">
          <div>Common problem</div>
          <div />
          <div>HyperFetch answer</div>
        </div>

        <div className="space-y-4">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <motion.div
                key={problem.title}
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

                <div className="relative flex items-center justify-center">
                  <ArrowRight className="size-5 rotate-90 text-zinc-500 lg:rotate-0" />
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
            );
          })}
        </div>
      </div>
    </section>
  );
};
