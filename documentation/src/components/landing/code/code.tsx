import React, { useState, useEffect } from "react";
import preview from "@site/static/video/preview.mp4";
import mobile from "@site/static/video/mobile.mp4";

export const CodePreview = () => {
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="mx-auto max-w-6xl w-[calc(100%-40px)] mb-10">
      <div className="flex items-center justify-center relative">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />
        <video
          className="block h-auto w-full overflow-hidden rounded-md"
          src={isMobile ? mobile : preview}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    </div>
  );
};
