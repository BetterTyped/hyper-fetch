/* eslint-disable react/no-array-index-key */
import { Description, Title, Noise, DocsCard } from "@site/src/components";
import { cn } from "@site/src/lib/utils";

const environments = [
  {
    name: "Web & PWA",
    description: "Browsers and PWAs, with focus, online state and persistent cache.",
    icon: "✅",
  },
  {
    name: "React",
    description: "Hooks for fetching, mutations, sockets and live queries.",
    icon: "✅",
  },
  {
    name: "React Native",
    description: "The same hooks, with AppState and NetInfo for focus and network.",
    icon: "✅",
  },
  {
    name: "Next.js",
    description: "Server components, route handlers and hydration of server data.",
    icon: "✅",
  },
  {
    name: "Electron",
    description: "Renderer and main process, with IPC between them.",
    icon: "✅",
  },
  {
    name: "SSR",
    description: "Astro, TanStack Router and other SSR setups hydrate server data.",
    icon: "✅",
  },
  {
    name: "Node.js",
    description: "Scripts, servers and workers, with the cache scoped per request.",
    icon: "✅",
  },
  {
    name: "Svelte",
    description: "Core works in Svelte. There are no Svelte bindings yet.",
    icon: "⚙️",
  },
  {
    name: "Vue",
    description: "Core works in Vue. There are no Vue bindings yet.",
    icon: "⚙️",
  },
];
export const Environments = () => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 my-10">
      {environments.map((item, index) => {
        return (
          <DocsCard className="h-full" key={index} hover={false}>
            <Noise visibility="medium" />
            <div className="flex flex-col p-6 h-full">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={cn(
                    `flex items-center h-6 w-6 min-h-6 min-w-6 justify-center mr-2 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`,
                  )}
                >
                  <span className="group-hover:brightness-120 w-4 h-4">{item.icon}</span>
                </div>
              </div>
              <Title size="none" className="font-semibold !leading-1" wrapperClass="flex flex-wrap !leading-6 mb-2">
                {item.name}
              </Title>
              <Description size="none" className="!text-sm !m-0">
                {item.description}
              </Description>
            </div>
          </DocsCard>
        );
      })}
    </div>
  );
};
