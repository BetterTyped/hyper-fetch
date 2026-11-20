import Link from "@docusaurus/Link";
import { motion } from "motion/react";

/*
 * The backends and runtimes Hyper Fetch works with, shown under the hero description. Each backend is an adapter or a
 * transport that keeps the same createRequest() and send() calls, and each logo links to its docs.
 */
const backends: { name: string; src: string; to: string; scale?: number }[] = [
  { name: "OpenAPI", to: "/docs/cli/commands/generate", src: "/img/integration-openapi.svg", scale: 1.35 },
  { name: "GraphQL", to: "/docs/integrations/adapter-graphql/overview", src: "/img/integration-graphql.svg" },
  { name: "tRPC", to: "/docs/integrations/adapter-trpc/overview", src: "/img/integration-trpc.svg", scale: 1.12 },
  { name: "oRPC", to: "/docs/integrations/adapter-orpc/overview", src: "/img/integration-orpc-dark.svg" },
  { name: "Hono", to: "/docs/integrations/hono/overview", src: "/img/integration-hono.svg" },
  { name: "Elysia", to: "/docs/integrations/elysia/overview", src: "/img/integration-elysia.svg" },
  { name: "Node.js", to: "/docs/getting-started/installation", src: "/img/integration-node.svg" },
  { name: "Bun", to: "/docs/getting-started/installation", src: "/img/integration-bun.svg", scale: 1.1 },
  { name: "Firebase", to: "/docs/integrations/adapter-firebase/overview", src: "/img/integration-firebase.svg" },
  { name: "Axios", to: "/docs/integrations/adapter-axios/overview", src: "/img/integration-axios.svg" },
  { name: "WebSockets", to: "/docs/sockets/overview", src: "/img/integration-sockets.svg" },
  { name: "React", to: "/docs/react/overview", src: "/img/integration-react.svg" },
];

export const Ecosystem = () => {
  return (
    <ul className="grid grid-cols-3 sm:grid-cols-6 xl:flex justify-center justify-items-center gap-x-2 gap-y-4 sm:gap-x-3 md:gap-x-4 xl:gap-x-3 list-none !p-0 !m-0 mt-6 md:mt-4 max-w-[90vw]">
      {backends.map((backend, index) => (
        <motion.li
          key={backend.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.15 + index * 0.05,
            ease: "easeOut",
          }}
          className="!m-0"
        >
          <Link
            to={backend.to}
            aria-label={`${backend.name} integration docs`}
            className="group flex flex-col items-center gap-2 w-[72px] md:w-[78px] rounded-2xl !no-underline outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70"
          >
            <span className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-solid border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 group-hover:border-white/25 group-hover:bg-white/[0.07] group-hover:-translate-y-0.5">
              <img
                src={backend.src}
                alt=""
                className="w-6 h-6 md:w-7 md:h-7 object-contain"
                style={backend.scale ? { transform: `scale(${backend.scale})` } : undefined}
              />
            </span>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200 whitespace-nowrap">
              {backend.name}
            </span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
};
