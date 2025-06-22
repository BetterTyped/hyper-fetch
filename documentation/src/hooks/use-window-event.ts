/* eslint-disable react-hooks/exhaustive-deps */
import { isBrowser, useIsomorphicLayoutEffect } from "motion/react";

export type EventHandler<T extends Event = Event> = (e: T) => void;

export type WindowEventHook = {
  <K extends keyof WindowEventMap>(
    event: K | [K, AddEventListenerOptions],
    handler: EventHandler<WindowEventMap[K]>,
    dependencies?: unknown[],
  ): void;
};

const unpackValue = <K extends keyof WindowEventMap>(
  event: K | [K, AddEventListenerOptions],
): [K, AddEventListenerOptions] => {
  if (typeof event === "string") {
    return [event, {}];
  }
  return event;
};

export const useWindowEvent: WindowEventHook = (event, handler, dependencies = []) => {
  useIsomorphicLayoutEffect(() => {
    if (!isBrowser) return;

    const [name, options] = unpackValue(event);
    const windowOptions = typeof options === "object" ? options : {};

    window.addEventListener(name, handler, windowOptions);
    return () => {
      window.removeEventListener(name, handler, windowOptions);
    };
  }, [JSON.stringify(event), ...dependencies]);
};
