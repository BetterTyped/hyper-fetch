import { PhotonBeam } from "@site/src/components/photon-beam/photon-beam";
import { motion } from "motion/react";
import React from "react";

import { SectionHeader } from "../shared/section-header";
import { HubFeed } from "./hub-feed";

/* "One typed client for every API": the photon beam, then typed responses from every protocol */
const BEAM_BG = "#1c1c1d";

export function Hub(): React.JSX.Element {
  return (
    <section className="relative -mt-10 pt-0 pb-12 md:pt-28 md:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          className="mb-0 md:mb-0"
          eyebrow="Your API layer"
          title="One typed client for every API"
          description={
            <>
              Every protocol. One <code>.send()</code>. Fully typed.
            </>
          }
        />
      </div>

      <div
        className="relative left-1/2 -my-[600px] h-[1400px] w-screen -translate-x-1/2 overflow-hidden -z-10"
        style={{ backgroundColor: BEAM_BG }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
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

      <div className="landing-scope mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <HubFeed />
      </div>
    </section>
  );
}
