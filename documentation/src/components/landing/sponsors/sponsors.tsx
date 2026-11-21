import { motion } from "motion/react";
import React from "react";

import { SectionHeader, fadeUp } from "../shared/section-header";

/* The sponsors section from the landing, on the shared section head */
export const Sponsors = () => (
  <section className="relative pb-20 pt-4">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Support the development"
        title="Our wonderful sponsors"
        description={
          <>
            Thank you to everyone keeping HyperFetch going. Join them through{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://github.com/sponsors/prc5"
              className="!text-yellow-300"
            >
              GitHub Sponsors
            </a>
            .
          </>
        }
      />
      <motion.a
        {...fadeUp(3)}
        href="https://github.com/sponsors/prc5"
        className="block"
      >
        <img
          src="https://github.com/prc5/sponsors/blob/main/packages/all/sponsorkit/sponsors.png?raw=true"
          alt="HyperFetch sponsors"
          className="mx-auto w-full max-w-[900px]"
        />
      </motion.a>
    </div>
  </section>
);
