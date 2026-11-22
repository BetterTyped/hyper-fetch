import { cn } from "@site/src/lib/utils";
import FirebaseIcon from "@site/static/img/integration-firebase.svg";
import GraphqlIcon from "@site/static/img/integration-graphql.svg";
import RestIcon from "@site/static/img/integration-rest.svg";
import SocketsIcon from "@site/static/img/integration-sockets.svg";
import { Check } from "lucide-react";
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
const tripledProtocols = Array.from(
  { length: CAROUSEL_COPIES },
  () => protocols,
).flat();

export function AdapterSwapAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.3,
  });

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

  // 0 call starts · 1 dot to the adapter result · 2 status · 3 dot to the app · 4 app green
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    if (!isInView) return undefined;
    const timers = [250, 750, 950, 1450].map((ms, i) =>
      setTimeout(() => setStep(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, isInView]);

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-2">
      {/* ── Protocol Carousel (active pill always centered) ─── */}
      <div ref={carouselRef} className="relative h-11 shrink-0 overflow-hidden">
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#1f1f21] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#1f1f21] to-transparent"
          aria-hidden
        />

        <motion.div
          className="absolute top-0 flex h-full items-center gap-2 px-2"
          animate={{ x: carouselOffset }}
          transition={
            animateCarousel
              ? { type: "spring", stiffness: 280, damping: 28 }
              : { duration: 0 }
          }
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
                  "shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all duration-300",
                  isActive
                    ? cn(p.accentBg, p.accentBorder, "scale-105")
                    : "border-white/[0.04] bg-white/[0.02] opacity-50 grayscale hover:opacity-80",
                )}
              >
                <PIcon className="size-4 shrink-0" />
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-tight",
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

      {/* ── Flow: the call goes out through the adapter, a dot carries it, the app turns green ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border-0 bg-[#2a2a2d] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.06]">
        {/* Adapter: icon and what it sends, no repeated name */}
        <div
          className={cn(
            "relative flex w-full max-w-[220px] items-center gap-2.5 rounded-xl border bg-[#1f1f21] px-3 py-2 transition-all duration-300",
            protocol.accentBorder,
            step === 0 && "shadow-[0_0_24px_-8px_rgba(255,255,255,0.35)]",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={protocol.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex min-w-0 items-center gap-2.5"
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate font-mono text-[12px] text-zinc-300">
                {protocol.payload}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <Connector run={step === 1} dotClass={protocol.accent} />

        {/* Response status, appears once the call lands */}
        <div className="flex h-6 items-center">
          <AnimatePresence mode="wait">
            {step >= 2 && (
              <motion.div
                key={`status-${protocol.name}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none",
                  protocol.accentBg,
                  protocol.accentBorder,
                  protocol.accentText,
                )}
              >
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    protocol.accent,
                  )}
                />
                {protocol.status}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Connector run={step === 3} dotClass="bg-emerald-400" />

        {/* Your app: waits, then turns green when the typed data arrives */}
        <div
          className={cn(
            "flex w-full max-w-[240px] items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors duration-300",
            step >= 4
              ? "border-emerald-400/35 bg-emerald-500/[0.07]"
              : "border-white/[0.08] bg-[#1f1f21]",
          )}
        >
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              step >= 4 ? "bg-emerald-400/15" : "bg-white/[0.04]",
            )}
          >
            {step >= 4 ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <span className="size-1.5 rounded-full bg-zinc-600" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold leading-tight text-zinc-100">
              Your app
            </div>
            <div
              className={cn(
                "text-[11px] leading-tight transition-colors",
                step >= 4 ? "text-emerald-300" : "text-zinc-500",
              )}
            >
              {step >= 4 ? "Typed data received" : "Waiting for data"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Connector ──────────────────────────────────────────────────── */

function Connector({ run, dotClass }: { run: boolean; dotClass: string }) {
  return (
    <div className="relative my-1 flex h-6 w-px items-center justify-center bg-white/[0.1]">
      {run && (
        <motion.span
          className={cn(
            "absolute size-1.5 rounded-full shadow-[0_0_8px_currentColor]",
            dotClass,
          )}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 12, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
