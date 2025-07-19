import Link from "@docusaurus/Link";
import { Description, Highlighter, Title } from "@site/src/components";
import { BrainCircuit, LayoutDashboard, Milestone } from "lucide-react";
import { motion } from "motion/react";

import { SmallBlock } from "../blocks/small-block/small-block";

const aboutFeatures = [
  {
    icon: BrainCircuit,
    title: "AI / LLM Ready",
    description:
      "A standardized architecture that's AI-friendly, enabling AI-powered adapter and SDK generation with out-of-the-box LLM support.",
    link: "/docs/getting-started/ai",
    promo: true,
  },
  {
    icon: Milestone,
    title: "Fetching Standard",
    description:
      "Enhance DX, reduce errors, and accelerate development with a robust fetching standard, featuring codegen for Swagger/OpenAPI.",
    link: "/docs/core/overview",
  },
  {
    icon: LayoutDashboard,
    title: "Dedicated Devtools",
    description:
      "Gain deep insights with dedicated devtools. Monitor statistics, analyze performance, and take full control of your data and cache.",
    link: "/docs/hyper-flow",
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
                Unified Fetching Layer
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
              Learn once, use everywhere
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Description className="text-lg !text-zinc-400">
              Hyper-Fetch is the data-exchange framework for modern development needs. It provides first-class
              type-safety, an exceptional developer experience, and deep architectural flexibility.
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
