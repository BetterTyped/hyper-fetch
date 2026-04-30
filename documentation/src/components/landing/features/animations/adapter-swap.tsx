import FirebaseIcon from "@site/static/img/integration-firebase.svg";
import GraphqlIcon from "@site/static/img/integration-graphql.svg";
import RestIcon from "@site/static/img/integration-rest.svg";
import SocketsIcon from "@site/static/img/integration-sockets.svg";
import { cn } from "@site/src/lib/utils";
import { ArrowDownToLine, Check, MonitorSmartphone } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/* ─── Protocol Data ───────────────────────────────────────────────── */

interface Protocol {
  name: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  payload: string;
  status: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  pulse?: boolean;
}

const protocols: Protocol[] = [
  {
    name: "REST",
    Icon: RestIcon,
    payload: "/users",
    status: "200 OK",
    accent: "bg-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-400/40",
    accentText: "text-emerald-300",
  },
  {
    name: "GraphQL",
    Icon: GraphqlIcon,
    payload: "{ users { id } }",
    status: "12 records",
    accent: "bg-fuchsia-400",
    accentBg: "bg-fuchsia-500/10",
    accentBorder: "border-fuchsia-400/40",
    accentText: "text-fuchsia-300",
  },
  {
    name: "Firebase",
    Icon: FirebaseIcon,
    payload: "doc('users/:id')",
    status: "snapshot synced",
    accent: "bg-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-400/40",
    accentText: "text-amber-300",
  },
  {
    name: "Sockets",
    Icon: SocketsIcon,
    payload: "/notifications",
    status: "live · 24ms",
    accent: "bg-sky-400",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-400/40",
    accentText: "text-sky-300",
    pulse: true,
  },
];

/* ─── Component ──────────────────────────────────────────────────── */

// Render N copies so we can scroll forever in one direction, then silently
// snap back to the middle copy when we cross into the last one.
const CAROUSEL_COPIES = 3;
const tripledProtocols = Array.from({ length: CAROUSEL_COPIES }, () => protocols).flat();

export function AdapterSwapAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isInView = useInView(containerRef as React.RefObject<Element>, { amount: 0.3 });

  // absoluteIdx counts forever; visible "active" is absoluteIdx % protocols.length
  const N = protocols.length;
  const [absoluteIdx, setAbsoluteIdx] = useState(N); // start in middle copy
  const [animateCarousel, setAnimateCarousel] = useState(true);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const active = absoluteIdx % N;

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setAnimateCarousel(true);
      setAbsoluteIdx((prev) => prev + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, [isInView]);

  // Compute translate offset so the pill at absoluteIdx is centered in the viewport
  useLayoutEffect(() => {
    const recompute = () => {
      const carousel = carouselRef.current;
      const pill = pillRefs.current[absoluteIdx];
      if (!carousel || !pill) return;
      const carouselWidth = carousel.clientWidth;
      const pillCenter = pill.offsetLeft + pill.offsetWidth / 2;
      setCarouselOffset(carouselWidth / 2 - pillCenter);
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [absoluteIdx]);

  // Re-enable animation on the next frame after a silent snap-back.
  useEffect(() => {
    if (animateCarousel) return;
    const id = requestAnimationFrame(() => setAnimateCarousel(true));
    return () => cancelAnimationFrame(id);
  }, [animateCarousel]);

  // After spring settles, if we're past the middle copy, snap back N steps
  // (same protocol, equivalent visual position) with animation disabled.
  const handleCarouselSettled = () => {
    if (absoluteIdx >= 2 * N) {
      setAnimateCarousel(false);
      setAbsoluteIdx((prev) => prev - N);
    }
  };

  const handlePillClick = (clickedAbsoluteIdx: number) => {
    setAnimateCarousel(true);
    setAbsoluteIdx(clickedAbsoluteIdx);
  };

  const protocol = protocols[active];
  const { Icon } = protocol;

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-2">
      {/* ── Protocol Carousel (active pill always centered) ─── */}
      <div
        ref={carouselRef}
        className="relative h-14 overflow-hidden rounded-md border border-white/[0.06] bg-zinc-950/60"
      >
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-950/80 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950/80 to-transparent"
          aria-hidden
        />

        <motion.div
          className="absolute top-0 flex h-full items-center gap-2 px-2"
          animate={{ x: carouselOffset }}
          transition={animateCarousel ? { type: "spring", stiffness: 280, damping: 28 } : { duration: 0 }}
          onAnimationComplete={handleCarouselSettled}
        >
          {tripledProtocols.map((p, i) => {
            const isActive = i === absoluteIdx;
            const PIcon = p.Icon;
            return (
              <button
                key={`${p.name}-${i}`}
                ref={(el) => {
                  pillRefs.current[i] = el;
                }}
                type="button"
                onClick={() => handlePillClick(i)}
                className={cn(
                  "shrink-0 flex items-center gap-2 rounded-md border px-3 py-1.5 transition-all duration-300",
                  isActive
                    ? cn(p.accentBg, p.accentBorder, "scale-105")
                    : "border-white/[0.04] bg-white/[0.02] opacity-50 grayscale hover:opacity-80",
                )}
              >
                <PIcon className="size-5 shrink-0" />
                <span
                  className={cn(
                    "text-[12px] font-semibold tracking-tight",
                    isActive ? "text-zinc-100" : "text-zinc-400",
                  )}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Chain Visualization ──────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-md border border-white/[0.06] bg-zinc-950/60 px-3 py-2">
        {/* Step 1: invariant call — Request pill with shimmer + subtle icon pulse */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-zinc-900/70 px-3 py-1">
          <motion.div
            animate={{ y: [0, 1.5, 0], opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex"
          >
            <ArrowDownToLine className="size-3.5 text-zinc-300" />
          </motion.div>
          <motion.span
            className="text-[12px] font-semibold tracking-tight"
            style={{
              backgroundImage: "linear-gradient(90deg, #71717a 0%, #fafafa 50%, #71717a 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          >
            Request
          </motion.span>
        </div>

        <Connector />

        {/* Step 2: protocol-specific cartridge */}
        <div
          className={cn(
            "relative w-full max-w-[220px] overflow-hidden rounded-md border bg-zinc-900/70 px-2.5 py-1.5 transition-colors duration-300",
            protocol.accentBorder,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -inset-px rounded-md opacity-40 blur-md transition-colors duration-500",
              protocol.accentBg,
            )}
            aria-hidden
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={protocol.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="relative flex items-center gap-2"
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border bg-zinc-950/70",
                  protocol.accentBorder,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold leading-tight text-zinc-100">{protocol.name}</div>
                <div className="truncate font-mono text-[9.5px] leading-tight text-zinc-500">{protocol.payload}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <Connector />

        {/* Step 3: response status (varies per protocol) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`status-${protocol.name}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] leading-none",
              protocol.accentBg,
              protocol.accentBorder,
              protocol.accentText,
            )}
          >
            <span
              className={cn("inline-block size-1.5 rounded-full", protocol.accent, protocol.pulse && "animate-pulse")}
            />
            {protocol.status}
          </motion.div>
        </AnimatePresence>

        <Connector />

        {/* Step 4: invariant — data lands in YOUR APP (bigger text + icons) */}
        <div className="w-full max-w-[240px] overflow-hidden rounded-md border border-emerald-400/30 bg-emerald-500/[0.05]">
          <div className="flex items-center gap-2 border-b border-white/[0.05] px-2.5 py-1.5">
            <div className="flex gap-1">
              <div className="size-1.5 rounded-full bg-zinc-700" />
              <div className="size-1.5 rounded-full bg-zinc-700" />
              <div className="size-1.5 rounded-full bg-zinc-700" />
            </div>
            <MonitorSmartphone className="ml-0.5 size-4 text-zinc-400" />
            <span className="text-[12px] font-semibold text-zinc-100">Your app</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <Check className="size-4 shrink-0 text-emerald-400" />
            <span className="text-[12px] font-medium text-zinc-200">Typed data received</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Connector ──────────────────────────────────────────────────── */

function Connector() {
  return <div className="my-1 h-2.5 w-px bg-white/[0.1]" />;
}
