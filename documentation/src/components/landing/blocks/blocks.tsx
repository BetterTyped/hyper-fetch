/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { Description, Title } from "@site/src/components";
import { Highlighter } from "@site/src/components/highlighter";
import { Particles } from "@site/src/components/particles";
import { CliSdkDemo } from "@site/src/components/landing/features/cli-sdk-demo";
import { motion } from "motion/react";

import { BigBlock } from "./big-block/big-block";
import { MediumBlock } from "./medium-block/medium-block";

const FeatureImg02 = "/img/feature-integrations.png";
const FeatureImg03 = "/img/feature-image-03.png";

export const Blocks = () => {
  return (
    <section className="relative pb-20 ">
      {/* Particles animation */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-80 h-80 -mt-24 -ml-32">
        <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-16 md:pt-20">
          {/* Section header */}
          <div className="">
            <div className="max-w-3xl mx-auto text-center pb-6 md:pb-10">
              <div className="relative">
                <div className="sticky top-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
                      Built for shipping
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
                      From schema to typed SDK
                    </Title>
                  </motion.div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Description className="text-lg text-zinc-400">
                  Skip the boilerplate. HyperFetch generates the API layer for you, with the strongest type safety in
                  the ecosystem.
                </Description>
              </motion.div>
            </div>
          </div>
          {/* Highlighted boxes */}
          <div className="relative pb-12 md:pb-20">
            {/* Blurred shape */}
            <div
              className="absolute bottom-0 -mb-20 left-1/2 -translate-x-1/2 blur-2xl pointer-events-none opacity-50 dark:opacity-50"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
                <defs>
                  <linearGradient id="bs2-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                    <stop offset="0%" stopColor="#fbc646" />
                    <stop offset="100%" stopColor="#fbc646" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="dark:fill-yellow-700 fill-yellow-300"
                  fillRule="evenodd"
                  d="m346 898 461 369-284 58z"
                  transform="translate(-346 -898)"
                />
              </svg>
            </div>
            <Highlighter className="grid md:grid-cols-12 gap-6 group">
              <Link to="/docs/cli/commands/generate" className="!no-underline md:col-span-12">
                <BigBlock
                  title="Generate a typed SDK in seconds"
                  description="Point the CLI at any OpenAPI or Swagger schema and ship a fully typed SDK. Every endpoint becomes a typed method - params, payloads, responses, errors. Zero manual typing."
                  img={
                    <div className="flex items-center justify-center h-full w-full p-4">
                      <CliSdkDemo bare />
                    </div>
                  }
                />
              </Link>
              <Link to="/docs/guides/typescript/extend" className="!no-underline md:col-span-7">
                <MediumBlock
                  title="Designed for Type Safety"
                  description="End-to-end TypeScript from schema to response. Typed params, payloads, errors - and zero any. Catch bugs at compile time, not in production."
                  img={
                    <img
                      className="absolute w-[240%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg02}
                      alt="Feature 02"
                    />
                  }
                />
              </Link>
              <Link to="/docs/getting-started" className="!no-underline md:col-span-5">
                <MediumBlock
                  title="Open Source. Zero Lock-in."
                  description="Framework agnostic, near-zero dependencies, MIT licensed. Drop it into any project and own your stack."
                  img={
                    <img
                      className="absolute w-[160%] h-auto top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 max-w-none"
                      src={FeatureImg03}
                      alt="Feature 03"
                    />
                  }
                />
              </Link>
            </Highlighter>
          </div>
        </div>
      </div>
    </section>
  );
};
