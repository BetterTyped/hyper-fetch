import { Description, Title } from "@site/src/components";
import { motion } from "motion/react";

export const Sponsors = () => {
  return (
    <section className="relative pb-20 ">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          viewport={{ once: true }}
        >
          <div>
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Support the development.
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
            Our wonderful sponsors
          </Title>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          viewport={{ once: true }}
        >
          <Description size="none" className="text-lg">
            We&apos;re grateful to the following companies and individuals who have supported us financially. You can
            still help us by joining the{" "}
            <a target="_blank" rel="noreferrer" href="https://github.com/sponsors/prc5">
              GitHub Sponsors program
            </a>{" "}
            or <a href="mailto:maciekpyrc@gmail.com">contact us</a> for other ways of support or collaboration.
          </Description>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <a href="https://github.com/sponsors/prc5">
            <img
              src="https://github.com/prc5/sponsors/blob/main/packages/all/sponsorkit/sponsors.png?raw=true"
              alt="My Sponsors"
              className="max-w-[900px] mx-auto w-full"
            />
          </a>
        </div>
      </motion.div>
    </section>
  );
};
