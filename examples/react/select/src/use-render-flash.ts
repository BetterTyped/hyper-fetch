import { useEffect, useRef } from "react";

/** Flashes the element after every render of the component that calls it, to make re-renders visible. */
export const useRenderFlash = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  // No dependency array on purpose: this runs after each render.
  useEffect(() => {
    ref.current?.animate(
      [{ boxShadow: "0 0 0 3px rgb(255 196 0 / 0.9)" }, { boxShadow: "0 0 0 3px rgb(255 196 0 / 0)" }],
      { duration: 900 },
    );
  });

  return ref;
};
