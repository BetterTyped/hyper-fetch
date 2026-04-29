import Link from "@docusaurus/Link";
import { Description, Highlighter, Title } from "@site/src/components";
import { Globe, Layers, Monitor } from "lucide-react";
import { motion } from "motion/react";

import { SmallBlock } from "../blocks/small-block/small-block";

const aboutFeatures = [
  {
    icon: Monitor,
    title: "Every Framework",
    description:
      "React, Next.js, Remix, Astro, Node.js, Bun — same API and same patterns everywhere. Build SPAs, SSR apps, or edge functions with one SDK.",
    link: "/docs/getting-started",
  },
  {
    icon: Layers,
    title: "Every API Protocol",
    description:
      "REST, GraphQL, Firebase, WebSockets, Server-Sent Events — connect through one consistent interface. Swap adapters without rewriting code.",
    link: "/docs/core/overview",
    promo: true,
  },
  {
    icon: Globe,
    title: "Every Environment",
    description:
      "Browser, server, edge, mobile — HyperFetch runs anywhere JavaScript runs. Full offline support, queuing, and retries in every environment.",
    link: "/docs/getting-started",
  },
];

export const About = () => {
  return (
    <section className="relative pb-20 pt-10">
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
                Universal by design
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
              Works everywhere
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Description className="text-lg !text-zinc-400">
              One SDK that works with every framework, every API protocol, and every environment. Learn it once, use it
              everywhere.
            </Description>
          </motion.div>
        </div>
        <Highlighter className="grid md:grid-cols-3 gap-8">
          {aboutFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link to={feature.link} className="!no-underline h-full">
                <SmallBlock
                  icon={<feature.icon className="size-6 text-yellow-500" />}
                  title={feature.title}
                  description={feature.description}
                  promo={feature.promo}
                />
              </Link>
            </motion.div>
          ))}
        </Highlighter>
      </div>
    </section>
  );
};
