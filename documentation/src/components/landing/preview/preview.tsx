import React from "react";
import DashboardPreview from "@site/static/img/previews/app.png";
import { Description, Title } from "@site/src/components";
import { motion } from "motion/react";
import Link from "@docusaurus/Link";

import { BorderBeam } from "./border-beam";

export function Preview(): JSX.Element {
  return (
    <section className="relative pb-20 pt-4 -z-10 group mb-28">
      {/* <Particles className="absolute inset-0 -z-10" /> */}

      {/* Section header */}
      <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          viewport={{ once: true }}
        >
          <div>
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Power up your development workflow
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
            Meet HyperFlow Devtools
          </Title>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          viewport={{ once: true }}
        >
          <Description className="text-lg !text-zinc-400 mb-8">
            Experience next-level debugging with real-time request tracking, detailed error analysis, and comprehensive
            performance metrics with HyperFlow devtools.
          </Description>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center">
            <Link
              className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
              to="/docs/hyper-flow/download"
            >
              Get Devtools Access
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 rounded-md overflow-hidden -mb-[20vh]">
            <div className="relative w-fit h-fit rounded-md overflow-hidden">
              <BorderBeam duration={8} size={500} />
              <BorderBeam duration={8} size={500} delay={4} />
              <img src={DashboardPreview} alt="preview" className="transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--background)] to-transparent from-5% to-20%" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
