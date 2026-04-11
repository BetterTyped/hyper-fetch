/* eslint-disable react/no-array-index-key */
import { Description, Title, Noise, DocsCard } from "@site/src/components";
import { cn } from "@site/src/lib/utils";

const environments = [
  {
    name: "Web & PWA",
    description: "Fully supported Web and PWA environments.",
    icon: "✅",
  },
  {
    name: "React",
    description: "Fully supported React environments with hooks and integrations.",
    icon: "✅",
  },
  {
    name: "React Native",
    description: "Fully supported React Native environments with hooks and integrations.",
    icon: "✅",
  },
  {
    name: "Next.js",
    description: "Fully supported Next.js environments with hooks, integrations, hydration and SSR.",
    icon: "✅",
  },
  {
    name: "Electron",
    description: "Fully supported Electron environments with hooks and integrations.",
    icon: "✅",
  },
  {
    name: "SSR",
    description: "Fully supported SSR environments (Next.js, Astro, Tanstack Router) with hydration abilities.",
    icon: "✅",
  },
  {
    name: "Node.js",
    description: "Supporting Node.js environments with server integrations.",
    icon: "✅",
  },
  {
    name: "Svelte",
    description: "Hyper Fetch is working with Svelte, but do not expose any hooks yet.",
    icon: "⚙️",
  },
  {
    name: "Vue",
    description: "Hyper Fetch is working with Vue, but do not expose any hooks yet.",
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
