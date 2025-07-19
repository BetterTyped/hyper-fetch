/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Description, Title } from "@site/src/components";

import { Cards } from "./cards";

export const Modules = () => {
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);

  const isInView1 = useInView(ref1, { once: true, margin: "-100px" });
  const isInView2 = useInView(ref2, { once: true, margin: "-100px" });
  const isInView3 = useInView(ref3, { once: true, margin: "-100px" });

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <motion.div
              ref={ref1}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: "easeOut",
              }}
            >
              <div>
                <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                  Where DX meets business
                </div>
              </div>
            </motion.div>
            <motion.div
              ref={ref2}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut",
              }}
            >
              <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
                Scale your development
              </Title>
            </motion.div>
            <motion.div
              ref={ref3}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut",
              }}
            >
              <Description className="text-lg !text-zinc-400">
                With our platform you can build any type of application, from simple landing pages to complex enterprise
                systems.
              </Description>
            </motion.div>
          </div>

          <div className="relative mb-20">
            <Cards />
          </div>
        </div>
      </div>
    </section>
  );
};
