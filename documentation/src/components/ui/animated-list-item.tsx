import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@site/src/lib/utils";

const animationsTop = {
  initial: { scale: 0.7, opacity: 0, y: -60 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.7, opacity: 0, y: 60 },
  transition: { type: "spring", stiffness: 350, damping: 40 },
};
const animationsBottom = {
  initial: { scale: 0.7, opacity: 0, y: 60 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.7, opacity: 0, y: -60 },
  transition: { type: "spring", stiffness: 350, damping: 40 },
};

const animations = {
  top: animationsTop,
  bottom: animationsBottom,
};

export function AnimatedListItem({
  children,
  position = "top",
  className,
  open = true,
}: {
  children: React.ReactNode;
  position?: "top" | "bottom";
  className?: string;
  open?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { initial, animate, exit, transition } = animations[position];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          layout
          className={cn("mx-auto w-full", className)}
          ref={ref}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
