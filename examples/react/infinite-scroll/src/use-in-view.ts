import { useEffect, useRef } from "react";

/**
 * Calls `onVisible` when the returned ref's element comes near the viewport.
 * Plain IntersectionObserver: HyperFetch has no DOM helpers, so any trigger (observer, button, virtualizer) works.
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

    // A new observer reports the current state right away, so a sentinel that is still visible
    // after a short page loads triggers the next page too. `watch` re-creates it after every page.
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && callback.current(), {
      rootMargin: "300px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, watch]);

  return ref;
};
