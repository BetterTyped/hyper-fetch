import { motion } from "motion/react";

/*
 * The backends Hyper Fetch talks to, shown under the hero description. Each one is an adapter or a transport that
 * keeps the same createRequest() and send() calls.
 */
const backends: { name: string; src: string; scale?: number }[] = [
  { name: "OpenAPI", src: "/img/integration-openapi.svg", scale: 1.35 },
  { name: "GraphQL", src: "/img/integration-graphql.svg" },
  { name: "tRPC", src: "/img/integration-trpc.svg", scale: 1.12 },
  { name: "oRPC", src: "/img/integration-orpc.svg" },
  { name: "Firebase", src: "/img/integration-firebase.svg" },
  { name: "Axios", src: "/img/integration-axios.svg" },
  { name: "WebSockets", src: "/img/integration-sockets.svg" },
  { name: "React", src: "/img/integration-react.svg" },
];

export const Ecosystem = () => {
  return (
    <ul className="grid grid-cols-4 sm:flex sm:flex-wrap justify-center gap-x-2 gap-y-4 sm:gap-x-3 md:gap-x-5 list-none !p-0 !m-0 mt-6 md:mt-4 max-w-[90vw]">
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
          className="group flex flex-col items-center gap-2 w-[72px] md:w-[78px] !m-0"
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
        </motion.li>
      ))}
    </ul>
  );
};
