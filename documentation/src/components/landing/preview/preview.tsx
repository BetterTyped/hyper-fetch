import React, { useState, useEffect } from "react";
import DashboardPreview from "@site/static/img/previews/app.png";
import ProjectPerformance from "@site/static/img/previews/project-performance.png";
import ProjectCache from "@site/static/img/previews/project-cache.png";
import NetworkDetails from "@site/static/img/previews/network-details.png";
import CacheDetails from "@site/static/img/previews/cache-details.png";
import { Title } from "@site/src/components";
import { FadeIn } from "@site/src/components/fade-in/fade-in";
import Link from "@docusaurus/Link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BorderBeam } from "./border-beam";

const sections = [
  {
    title: "Dedicated Devtools",
    description:
      "Seamlessly integrate your app with Hyper Flow to unlock real-time request monitoring and gain instant insights.",
    image: DashboardPreview,
  },
  {
    title: "Performance Analysis",
    description: "Dive deep into your project's performance metrics, identify bottlenecks, and optimize efficiently.",
    image: ProjectPerformance,
  },
  {
    title: "Cache Management",
    description:
      "Visualize and manage your application's cache, ensuring optimal data retrieval and storage strategies.",
    image: ProjectCache,
  },
  {
    title: "Network Inspector",
    description:
      "Inspect every network request in detail, analyze headers, payloads, and timings to debug connectivity issues.",
    image: NetworkDetails,
  },
  {
    title: "Cache Viewer",
    description:
      "Explore cached data entries, understand expiration times, and fine-tune your caching mechanisms for peak performance.",
    image: CacheDetails,
  },
];

const SLIDE_DURATION = 4000;

export function Preview(): JSX.Element {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setTimeLeft] = useState(SLIDE_DURATION);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(SLIDE_DURATION);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          // Check if it's time to switch *before* decrementing to 0
          setCurrentSlide((prevSlide) => (prevSlide + 1) % sections.length);
          return SLIDE_DURATION; // Reset timer for the new slide
        }
        return prev - 1000;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }; // Clear interval on component unmount
  }, []);

  const goToNext = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % sections.length);
    startTimer(); // Reset and restart timer
  };

  const goToPrevious = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + sections.length) % sections.length);
    startTimer(); // Reset and restart timer
  };

  const currentSection = sections[currentSlide];

  return (
    <section className="relative pb-20 pt-4 -z-10 group mb-48">
      {/* <Particles className="absolute inset-0 -z-10" /> */}

      {/* Section header */}
      <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
        <FadeIn start={0.05} end={0.25}>
          <div>
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Power up your development workflow
            </div>
          </div>
        </FadeIn>
        <FadeIn start={0} end={0.2}>
          <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
            Hyper Flow
          </Title>
        </FadeIn>
        <FadeIn start={0.05} end={0.2}>
          <p className="text-lg text-zinc-400 mb-8">
            Experience next-level debugging with real-time request tracking, detailed error analysis, and comprehensive
            performance metrics.
          </p>
        </FadeIn>
        <FadeIn start={0.1} end={0.3}>
          <div className="flex justify-center">
            <Link
              className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-yellow-400 via-yellow-500 to-yellow-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-yellow-500 hover:to-yellow-400 dark:hover:from-yellow-500 dark:hover:to-yellow-400 hover:text-white hover:dark:text-zinc-900 transition-all"
              to="/docs/hyper-flow/download"
            >
              Download Hyper Flow
            </Link>
          </div>
        </FadeIn>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 blur-3xl -z-10 rounded-md" />
        <FadeIn start={0.2} end={0.5}>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 rounded-md overflow-hidden -mb-[20vh]">
            <div className="relative w-fit h-fit rounded-md overflow-hidden">
              <BorderBeam duration={8} size={400} />
              <BorderBeam duration={8} size={400} />
              <img src={currentSection.image} alt={currentSection.title} className="transition-opacity duration-500" />
              {/* bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--background)] to-transparent from-5% to-20%" />

              {/* Previous Button - Positioned absolutely */}
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/70 text-zinc-400 hover:text-zinc-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Next Button - Positioned absolutely */}
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/70 text-zinc-400 hover:text-zinc-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Next Slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Bottom section with active slide info (no buttons) */}
      <div className="relative max-w-6xl mx-auto -translate-y-6 px-4 sm:px-6 mb-24">
        {/* <div className="text-center">
          <div className="mb-4 p-3 bg-zinc-800/50 rounded-full mx-auto max-w-[50px]">
            <div className="text-zinc-400 text-xl">{currentSlide + 1}</div>
          </div>
          <div className="relative w-full h-0.5 mb-3 bg-zinc-700/50 rounded-full mx-auto max-w-[200px]">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${(1 - timeLeft / SLIDE_DURATION) * 100}%` }}
            />
          </div>
          <Title size="md">{currentSection.title}</Title>
          <Description className="max-w-xl mx-auto">{currentSection.description}</Description>
        </div> */}
      </div>
    </section>
  );
}
