import { useEffect, useRef } from "react";

/**
 * Calls `onVisible` while the element is near the viewport. `watch` creates a new observer after every change,
 * and a new observer reports the current state at once, so a still visible element triggers again.
 */
export const useInView = <T extends Element>(
  onVisible: () => void,
  { enabled, watch }: { enabled: boolean; watch: unknown },
) => {
  const ref = useRef<T>(null);
  const callback = useRef(onVisible);

  useEffect(() => {
    callback.current = onVisible;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return undefined;

    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && callback.current(), {
      rootMargin: "200px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, watch]);

  return ref;
};
