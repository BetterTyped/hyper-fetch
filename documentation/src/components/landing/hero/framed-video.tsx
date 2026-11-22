import mobile from "@site/static/video/mobile.mp4";
import preview from "@site/static/video/preview.mp4";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@site/src/lib/utils";

/*
 * The current product video, now inside a frame: a padded glass bezel with the same border and inset
 * shadow as the feature cards, a light catch on the top edge.
 */
export const FramedVideo = ({
  dock,
  className,
}: { dock?: React.ReactNode; className?: string } = {}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* A cached video can be ready before this runs, so read its state instead of assuming it is loading */
  useEffect(() => {
    setLoaded((videoRef.current?.readyState ?? 0) >= 3);
  }, [isMobile]);

  return (
    <div
      className={cn(
        "relative mx-auto max-w-6xl w-[calc(100%-40px)] mb-10",
        className,
      )}
    >
      {dock}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.16,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      >
        {/* Bezel */}
        <div className="relative rounded-[22px] p-2 md:p-2.5 bg-zinc-900/70 backdrop-blur-lg shadow-[0_-1px_#ffdbdf2f,0_0_0_1px_#ffffff14,2px_4px_16px_0px_rgba(248,248,248,0.06)_inset,0_40px_120px_-40px_rgba(0,0,0,0.9)]">
          {/* Light catching the top edge */}
          <div className="pointer-events-none absolute inset-x-[12%] -top-px h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />

          <div className="relative overflow-hidden rounded-[14px] border border-solid border-black/60 bg-[#0e0e10]">
            <div
              className="relative w-full"
              style={{ aspectRatio: isMobile ? "572 / 796" : "1152 / 548" }}
            >
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    className="absolute inset-0 z-10 bg-zinc-900"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                src={isMobile ? mobile : preview}
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => setLoaded(true)}
                onLoadedData={() => setLoaded(true)}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
