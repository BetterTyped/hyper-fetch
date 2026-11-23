import { animate, useMotionValue } from "motion/react";
import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

/** Pull further than this and the sheet closes on release. */
const CLOSE_DISTANCE = 96;
/** A flick faster than this (px per ms) closes it after a much shorter pull. */
const CLOSE_VELOCITY = 0.4;
/** How far a finger travels before it counts as a pull rather than a tap. */
const PULL_SLOP = 6;
/** Velocity is read over this window, so one jittery sample cannot fake a flick. */
const VELOCITY_WINDOW_MS = 120;
/** A finger that stopped moving this long before release is not flicking. */
const FLICK_PAUSE_MS = 80;

interface Sample {
  y: number;
  time: number;
}

interface Pull {
  pointerId: number;
  startX: number;
  startY: number;
  samples: Sample[];
  /** `pending` until the finger picks a direction, `drag` moves the sheet, `scroll` leaves the page alone */
  phase: "pending" | "drag" | "scroll";
}

/**
 * Picks what a pending gesture is once the finger has moved far enough. A mostly sideways move is a scroll, so rows
 * that scroll horizontally (the section pills) keep working. A downward move pulls the sheet.
 */
const decide = (dx: number, dy: number): Pull["phase"] => {
  if (Math.abs(dx) >= PULL_SLOP && Math.abs(dx) > Math.abs(dy)) return "scroll";
  if (dy <= -PULL_SLOP) return "scroll";
  if (dy >= PULL_SLOP) return "drag";
  return "pending";
};

const releaseVelocity = (samples: Sample[]) => {
  const now = performance.now();
  const recent = samples.filter(
    (sample) => now - sample.time <= VELOCITY_WINDOW_MS,
  );
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (!first || !last || first === last) return 0;
  if (now - last.time > FLICK_PAUSE_MS) return 0;
  return (last.y - first.y) / (last.time - first.time);
};

/**
 * Swipe down to close a bottom sheet. A downward pull drags the sheet after a few pixels. Inside the scrolling list it
 * only takes over when the list is already at the top, so scrolling back up never drags the sheet. Sideways swipes
 * are left to the browser, so the section pills scroll.
 */
export const useSwipeToClose = ({
  open,
  onClose,
  listRef,
}: {
  open: boolean;
  onClose: () => void;
  listRef: RefObject<HTMLDivElement | null>;
}) => {
  const y = useMotionValue(0);
  const pull = useRef<Pull | null>(null);
  const suppressClicksUntil = useRef(0);

  useEffect(() => {
    if (!open) return undefined;
    y.set(0);
    pull.current = null;

    const settle = () => {
      animate(y, 0, { type: "spring", stiffness: 520, damping: 44 });
    };

    const onPointerMove = (event: PointerEvent) => {
      const current = pull.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const offset = event.clientY - current.startY;

      if (current.phase === "pending") {
        current.phase = decide(event.clientX - current.startX, offset);
      }
      if (current.phase !== "drag") return;

      const now = performance.now();
      current.samples = current.samples.filter(
        (sample) => now - sample.time <= VELOCITY_WINDOW_MS,
      );
      current.samples.push({ y: event.clientY, time: now });
      y.set(Math.max(0, offset));
    };

    const onPointerUp = (event: PointerEvent) => {
      const current = pull.current;
      if (!current || event.pointerId !== current.pointerId) return;
      pull.current = null;
      if (current.phase !== "drag") return;

      const offset = y.get();
      if (offset === 0) return;
      // A mouse release over a link would otherwise count as a click on it
      suppressClicksUntil.current = performance.now() + 400;

      const flicked =
        releaseVelocity(current.samples) > CLOSE_VELOCITY &&
        offset > PULL_SLOP * 4;
      if (offset > CLOSE_DISTANCE || flicked) {
        onClose();
        return;
      }
      settle();
    };

    const onPointerCancel = (event: PointerEvent) => {
      const current = pull.current;
      if (!current || event.pointerId !== current.pointerId) return;
      pull.current = null;
      if (y.get() !== 0) settle();
    };

    // Non-passive, so the browser does not start its own scroll once the sheet owns the pull
    const onTouchMove = (event: TouchEvent) => {
      const current = pull.current;
      if (!current || current.phase === "scroll") return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - current.startX;
      const dy = touch.clientY - current.startY;

      if (current.phase === "pending") {
        current.phase = decide(dx, dy);
        if (current.phase === "scroll") return;
        // Still deciding: hold the page only for a downward move, so a sideways swipe keeps its native scroll
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return;
      }
      event.preventDefault();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, onClose, y]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const list = listRef.current;
    const insideList =
      list !== null &&
      event.target instanceof Node &&
      list.contains(event.target);
    if (insideList && list.scrollTop > 0) return;

    pull.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      samples: [],
      phase: "pending",
    };
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() >= suppressClicksUntil.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return { y, onPointerDown, onClickCapture };
};
