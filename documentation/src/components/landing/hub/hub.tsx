import { Description, Title } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { PhotonBeam } from "@site/src/components/photon-beam/photon-beam";
import { Bot, Network, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { Noise } from "../../ui/noise";

interface SignalPoint {
  icon: React.ElementType;
  label: string;
  title: string;
}

const signalPoints: SignalPoint[] = [
  {
    icon: Network,
    label: "Any API",
    title: "REST, GraphQL, Firebase, WebSockets, SSE. One request model.",
  },
  {
    icon: ShieldCheck,
    label: "Typed contract",
    title: "Typed params, payloads, responses, and errors. No any.",
  },
  {
    icon: Bot,
    label: "AI agents",
    title: "Expose the same typed operations to AI workflows.",
  },
];

const BEAM_BG = "#1c1c1d";

export function Hub(): React.JSX.Element {
  return (
    <section className="relative -mt-10 pt-0 pb-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-200">
              <Sparkles className="size-3.5" />
              API flow
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Title wrapperClass="h2 mt-5 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
              Streamline every API into one typed flow
            </Title>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Description className="mx-auto max-w-3xl !mb-0 !text-zinc-400">
              HyperFetch gives your app one typed path to every backend. Use the same SDK for UI code, server runtime,
              and AI workflows. Keep transport, cache, retries, realtime updates, and offline behavior in one place.
            </Description>
          </motion.div>
        </div>
      </div>

      <div
        className="relative left-1/2 -my-[600px] h-[1400px] w-screen -translate-x-1/2 overflow-hidden -z-10"
        style={{ backgroundColor: BEAM_BG }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative h-full w-full"
        >
          <PhotonBeam
            className="min-h-0"
            colorBg={BEAM_BG}
            colorLine="#7c5a12"
            colorSignal="#facc15"
            useColor2
            colorSignal2="#f59e0b"
            useColor3
            colorSignal3="#fde68a"
            positionY={0}
            cameraZ={118}
            fitToViewport
            sourceXRatio={0.35}
            endXRatio={1.12}
            curveXRatio={0.7}
            lineCount={96}
            spreadHeight={60}
            spreadDepth={8}
            curveLength={58}
            straightLength={620}
            curvePower={0.9}
            waveSpeed={2.45}
            waveHeight={0.11}
            lineOpacity={0.38}
            signalCount={120}
            speedGlobal={0.46}
            trailLength={4}
            bloomStrength={2.7}
            bloomRadius={0.58}
          />
        </motion.div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {signalPoints.map((point, index) => {
            const Icon = point.icon;

            return (
              <motion.div
                key={point.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
                className={cn(
                  "group/card relative isolate overflow-hidden rounded-2xl bg-zinc-900 p-4",
                  "[border:1px_solid_rgba(255,255,255,.1)]",
                  "[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
                  "transition-colors duration-500",
                )}
              >
                <Noise visibility="medium" />
                <div className="relative z-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <Icon className="size-4 text-yellow-400" />
                  {point.label}
                </div>
                <div className="relative z-10 mt-2 text-sm font-semibold leading-6 text-zinc-200">{point.title}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
