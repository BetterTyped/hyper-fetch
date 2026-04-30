import mobile from "@site/static/video/mobile.mp4";
import preview from "@site/static/video/preview.mp4";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";

export const CodePreview = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
  }, [isMobile]);

  return (
    <div className="mx-auto max-w-6xl w-[calc(100%-40px)] mb-10 -mt-10 md:mt-0 ">
      <div className="flex items-center justify-center relative">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />

        <div className="relative w-full" style={{ aspectRatio: isMobile ? "572 / 796" : "1152 / 548" }}>
          <AnimatePresence>
            {!loaded && (
              <motion.div
                className="absolute inset-0 z-10 overflow-hidden rounded-md border border-white/[0.06] bg-zinc-900"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-800/50" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-8 rounded-full bg-amber-500/10 blur-xl"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-800/80 px-4 py-2">
                      <motion.div
                        className="size-2 rounded-full bg-amber-400"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className="text-xs text-zinc-400 font-mono">Loading preview...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full overflow-hidden rounded-md object-cover z-100"
            src={isMobile ? mobile : preview}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
};
