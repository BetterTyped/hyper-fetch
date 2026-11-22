import { cn } from "@site/src/lib/utils";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { fadeUp } from "../shared/section-header";

/*
 * Under the "One typed client" beam: typed responses from every protocol stream by, one row at a time.
 */

const Logo = ({ src, className }: { src: string; className?: string }) => (
  <img
    src={`/img/integration-${src}.svg`}
    alt=""
    className={cn("size-4 object-contain", className)}
  />
);

const feed = [
  {
    logo: "rest",
    proto: "REST",
    call: "GET /users/42",
    type: "User",
    ms: "18ms",
  },
  {
    logo: "graphql",
    proto: "GraphQL",
    call: "query GetUser",
    type: "User",
    ms: "24ms",
  },
  {
    logo: "sockets",
    proto: "WebSocket",
    call: "on chat:message",
    type: "Message",
    ms: "live",
  },
  { logo: "trpc", proto: "tRPC", call: "user.byId", type: "User", ms: "11ms" },
  {
    logo: "firebase",
    proto: "Firebase",
    call: "users/42",
    type: "User",
    ms: "31ms",
  },
  {
    logo: "orpc-dark",
    proto: "oRPC",
    call: "posts.list",
    type: "Post[]",
    ms: "16ms",
  },
  {
    logo: "openapi",
    proto: "OpenAPI",
    call: "sdk.orders.$get",
    type: "Order[]",
    ms: "22ms",
  },
];

export const HubFeed = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  const [head, setHead] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    const t = setInterval(() => setHead((h) => h + 1), 1100);
    return () => clearInterval(t);
  }, [inView]);

  const rows = [0, 1, 2, 3, 4].map((i) => ({
    key: head - i,
    ...feed[(((head - i) % feed.length) + feed.length) % feed.length],
  }));

  return (
    <motion.div ref={ref} {...fadeUp(0)} className="mx-auto max-w-3xl">
      <div className="relative h-[232px] overflow-hidden [mask-image:linear-gradient(180deg,#000_55%,transparent)]">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => (
            <motion.div
              key={row.key}
              layout
              initial={{ opacity: 0, y: -14, filter: "blur(4px)" }}
              animate={{ opacity: 1 - i * 0.16, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-0 border-b border-solid border-white/[0.06] py-3 font-mono text-[13px] md:grid-cols-[130px_1fr_auto_56px]"
            >
              <span className="flex items-center gap-2 text-zinc-300">
                <Logo src={row.logo} /> {row.proto}
              </span>
              <span className="truncate text-zinc-500">{row.call}</span>
              <span className="text-zinc-400">
                →{" "}
                <span
                  className={cn(
                    i === 0 ? "text-yellow-300" : "text-emerald-300/80",
                  )}
                >
                  {row.type}
                </span>
              </span>
              <span className="hidden text-right text-zinc-600 md:block">
                {row.ms}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="!mb-0 !mt-2 text-center text-sm text-zinc-500">
        Seven protocols. One <code className="!text-[0.9em]">.send()</code>.
        Every response typed.
      </p>
    </motion.div>
  );
};
