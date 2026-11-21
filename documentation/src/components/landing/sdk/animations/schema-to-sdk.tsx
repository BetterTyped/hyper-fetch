import { cn } from "@site/src/lib/utils";
import { Check } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

/* ─── Data ────────────────────────────────────────────────────────── */

const autocompleteItems = [
  { method: "GET", name: "users.$get", returns: "User[]" },
  { method: "GET", name: "users.$userId.$get", returns: "User" },
  { method: "POST", name: "users.$post", returns: "User" },
  { method: "PATCH", name: "users.$userId.$patch", returns: "User" },
  { method: "DEL", name: "users.$userId.$delete", returns: "void" },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  PATCH: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  DEL: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

const SELECTED_IDX = 1; // users.$userId.$get
const HOVER_SEQUENCE = [0, 1, 2, 3, 4, 1]; // ends on selected
const HOVER_STEP_MS = 480;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/* ─── Phases ─────────────────────────────────────────────────────── */

const PHASE_TYPING = 0;
const PHASE_DROPDOWN = 1;
const PHASE_HOVER = 2;
const PHASE_SELECT = 3;
const PHASE_LOG = 4;
const PHASE_RUNNING = 5;
const PHASE_SUCCESS = 6;
const PHASE_PAUSE = 7;

const PHASE_DURATIONS = [
  1000, // TYPING
  450, // DROPDOWN open
  HOVER_SEQUENCE.length * HOVER_STEP_MS, // HOVER cycle
  500, // SELECT — commit autocomplete
  650, // LOG — write .setParams({ userId: 1 }).send();
  1300, // RUNNING — spinner
  1900, // SUCCESS — show response
  1100, // PAUSE — hold final state
];

/* ─── Component ──────────────────────────────────────────────────── */

export function SchemaToSdkAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.3,
  });
  const [phase, setPhase] = useState(PHASE_TYPING);
  const [typedText, setTypedText] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [spinnerFrame, setSpinnerFrame] = useState(0);

  const reset = useCallback(() => {
    setPhase(PHASE_TYPING);
    setTypedText("");
    setHoveredIdx(0);
    setSpinnerFrame(0);
  }, []);

  // Phase advance
  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      if (phase === PHASE_PAUSE) {
        reset();
      } else {
        setPhase((p) => p + 1);
      }
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase, isInView, reset]);

  // Typing animation for "sdk."
  useEffect(() => {
    if (phase !== PHASE_TYPING || !isInView) return;
    const target = "sdk.";
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      if (i < target.length) {
        setTypedText(target.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 220);
    return () => clearInterval(interval);
  }, [phase, isInView]);

  // Hover cycler — runs through HOVER_SEQUENCE and stops on the selected item
  useEffect(() => {
    if (phase !== PHASE_HOVER || !isInView) return;
    setHoveredIdx(HOVER_SEQUENCE[0]);
    const timers: number[] = [];
    HOVER_SEQUENCE.forEach((idx, step) => {
      if (step === 0) return;
      const id = window.setTimeout(
        () => setHoveredIdx(idx),
        step * HOVER_STEP_MS,
      );
      timers.push(id);
    });
    return () => timers.forEach(clearTimeout);
  }, [phase, isInView]);

  // Lock hovered index on selected item once SELECT/RUNNING/SUCCESS start
  useEffect(() => {
    if (phase >= PHASE_SELECT) setHoveredIdx(SELECTED_IDX);
  }, [phase]);

  // CLI spinner
  useEffect(() => {
    if (phase !== PHASE_RUNNING || !isInView) return;
    const id = window.setInterval(() => {
      setSpinnerFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 90);
    return () => clearInterval(id);
  }, [phase, isInView]);

  const showDropdown = phase === PHASE_DROPDOWN || phase === PHASE_HOVER;
  const showCommittedCall = phase >= PHASE_SELECT;
  const showLogLine = phase >= PHASE_LOG;
  const showGhostHover = phase === PHASE_HOVER;
  const hovered = autocompleteItems[hoveredIdx];

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-2">
      {/* ── Editor ──────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden rounded-xl border-0 bg-[#2a2a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.06]">
        {/* Code body — !important to override any CSS cascade */}
        <div className="relative px-4 py-3.5 font-mono leading-relaxed">
          {/* Line 1 — the call. Plain inline flow so spans sit next to each other */}
          <div className="whitespace-nowrap">
            <span className="!text-purple-400 !text-[13px]">const </span>
            <span className="!text-zinc-300 !text-[13px]">user = </span>
            <span className="!text-purple-400 !text-[13px]">await </span>
            <span className="!text-amber-300 !text-[13px]">
              {typedText || "sdk"}
            </span>

            {/* blinking cursor while typing */}
            {phase === PHASE_TYPING && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="ml-px inline-block h-2 w-[1.5px] bg-zinc-300 align-middle !text-[13px]"
              />
            )}

            {/* ghost preview while hovering an item */}
            {showGhostHover && hovered && (
              <motion.span
                key={`ghost-${hovered.name}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-zinc-400 !text-[13px]"
              >
                {hovered.name}
              </motion.span>
            )}

            {/* committed autocomplete after selection */}
            {showCommittedCall && (
              <motion.span
                key="committed"
                initial={{ opacity: 0, x: -3 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
              >
                <span className="text-zinc-200 !text-[13px]">
                  {autocompleteItems[SELECTED_IDX].name}
                </span>
              </motion.span>
            )}
          </div>

          {/* Line 2 — .setParams({ userId: 1 }).send(); appears after selection */}
          <AnimatePresence>
            {showLogLine && (
              <motion.div
                key="log-line"
                initial={{ opacity: 0, x: -3 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-0.5 whitespace-nowrap pl-4"
              >
                <span className="!text-zinc-500 !text-[13px]">.</span>
                <span className="!text-amber-300 !text-[13px]">setParams</span>
                <span className="!text-zinc-500 !text-[13px]">{"({ "}</span>
                <span className="!text-sky-300 !text-[13px]">userId</span>
                <span className="!text-zinc-500 !text-[13px]">{": "}</span>
                <span className="!text-amber-300 !text-[13px]">1</span>
                <span className="!text-zinc-500 !text-[13px]">{" })."}</span>
                <span className="!text-amber-300 !text-[13px]">send</span>
                <span className="!text-zinc-500 !text-[13px]">();</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slot below — dropdown OR runtime output */}
          <AnimatePresence mode="wait">
            {showDropdown && (
              <motion.div
                key="dropdown"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="mt-3 overflow-hidden rounded-xl border-0 bg-[#333337] p-1.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/[0.1]"
              >
                {autocompleteItems.map((item, i) => {
                  const isHovered = phase === PHASE_HOVER && i === hoveredIdx;
                  return (
                    <div
                      key={item.name}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-1.5 leading-tight transition-colors",
                        isHovered ? "bg-amber-500/15" : "",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block min-w-[48px] shrink-0 rounded-md border px-1.5 py-1 text-center !text-[10.5px] font-bold leading-none",
                          methodColors[item.method],
                        )}
                      >
                        {item.method}
                      </span>
                      <span
                        className={
                          isHovered
                            ? "text-zinc-100 !text-[13px]"
                            : "text-zinc-300 !text-[13px]"
                        }
                      >
                        {item.name}
                      </span>
                      <span className="ml-auto truncate text-zinc-600 !text-[13px]">
                        {item.returns}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {phase === PHASE_RUNNING && (
              <motion.div
                key="running"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mt-3 flex items-center gap-1.5 !text-[13px]"
              >
                <span className="w-3 !text-amber-400 !text-[13px]">
                  {SPINNER_FRAMES[spinnerFrame]}
                </span>
                <span className="!text-zinc-500 !text-[13px]">Fetching</span>
                <span className="font-mono !text-zinc-600 !text-[13px]">
                  /users/1
                </span>
                <span className="!text-zinc-700 !text-[13px]">…</span>
              </motion.div>
            )}

            {(phase === PHASE_SUCCESS || phase === PHASE_PAUSE) && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="mt-3 overflow-hidden rounded-xl border border-emerald-400/25 bg-emerald-500/[0.04]"
              >
                {/* Top bar — compact status line */}
                <div className="flex items-center gap-1.5 border-b border-emerald-400/15 px-3 py-2">
                  <span className="inline-flex size-3 items-center justify-center rounded-full bg-emerald-400/20">
                    <Check className="size-2 !text-emerald-300" />
                  </span>
                  <span className="!text-[13px] font-semibold uppercase tracking-wider !text-emerald-300">
                    200 OK
                  </span>
                  <span className="!text-[13px] !text-zinc-600">·</span>
                  <span className="!text-[13px] font-medium !text-zinc-300">
                    User
                  </span>
                  <span className="ml-auto font-mono !text-[13px] !text-zinc-500">
                    12 ms
                  </span>
                </div>
                {/* Body — the typed response, formatted */}
                <div className="px-3 py-2 font-mono leading-[1.45] text-zinc-400">
                  <div className="!text-zinc-600 !text-[13px]">{"{"}</div>
                  <motion.div
                    key="id"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="whitespace-nowrap pl-4"
                  >
                    <span className="!text-sky-300 !text-[13px]">id</span>
                    <span className="!text-zinc-600 !text-[13px]">: </span>
                    <span className="!text-amber-300 !text-[13px]">{"1"}</span>
                    <span className="!text-zinc-600 !text-[13px]">,</span>
                  </motion.div>
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="whitespace-nowrap pl-4"
                  >
                    <span className="!text-sky-300 !text-[13px]">name</span>
                    <span className="!text-zinc-600 !text-[13px]">: </span>
                    <span className="!text-emerald-300 !text-[13px]">
                      {'"Ada Lovelace"'}
                    </span>
                    <span className="!text-zinc-600 !text-[13px]">,</span>
                  </motion.div>
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className="whitespace-nowrap pl-4"
                  >
                    <span className="!text-sky-300 !text-[13px]">email</span>
                    <span className="!text-zinc-600 !text-[13px]">: </span>
                    <span className="!text-emerald-300 !text-[13px]">
                      {'"ada@hyperfetch.dev"'}
                    </span>
                    <span className="!text-zinc-600 !text-[13px]">,</span>
                  </motion.div>
                  <motion.div
                    key="posts"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.25 }}
                    className="whitespace-nowrap pl-4"
                  >
                    <span className="!text-sky-300 !text-[13px]">posts</span>
                    <span className="!text-zinc-600 !text-[13px]">: </span>
                    <span className="!text-violet-300 !text-[13px]">
                      {"Post[3]"}
                    </span>
                    <span className="!text-zinc-600 !text-[13px]">,</span>
                  </motion.div>
                  <div className="!text-zinc-600 !text-[13px]">{"}"}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
