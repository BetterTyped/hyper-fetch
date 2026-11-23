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
  startY: number;
  samples: Sample[];
  /** `pending` until the finger picks a direction, `drag` moves the sheet, `scroll` leaves the list alone */
  phase: "pending" | "drag" | "scroll";
}

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
 * Swipe down to close a bottom sheet. Outside the scrolling list the sheet follows the finger at once. Inside it a
 * downward pull only takes over when the list is already at the top, so scrolling back up never drags the sheet.
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
        if (offset <= -PULL_SLOP) {
          current.phase = "scroll";
          return;
        }
        if (offset < PULL_SLOP) return;
        current.phase = "drag";
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
      const offset = touch.clientY - current.startY;

      if (current.phase === "pending") {
        if (offset < 0) {
          current.phase = "scroll";
          return;
        }
        if (offset === 0) return;
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
      startY: event.clientY,
      samples: [],
      phase: insideList ? "pending" : "drag",
    };
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() >= suppressClicksUntil.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return { y, onPointerDown, onClickCapture };
};
