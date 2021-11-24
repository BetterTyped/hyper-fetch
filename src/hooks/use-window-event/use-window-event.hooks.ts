import { useRef } from "react";
import { useDidUpdate, useIsMounted } from "@better-typed/react-lifecycle-hooks";

type EventHandler<T extends Event = Event> = (e: T) => void;

type WindowEventHook = {
  <K extends keyof WindowEventMap>(
    eventName: K,
    handler: EventHandler<WindowEventMap[K]>,
    disabled?: boolean,
    options?: boolean | AddEventListenerOptions,
  ): void;
};

export const useWindowEvent: WindowEventHook = (eventName, handler, disabled, options) => {
  const isMounted = useIsMounted();

  const handlerRef = useRef<typeof handler>(handler);
  handlerRef.current = handler;

  useDidUpdate(
    () => {
      if (!window || !document || disabled) {
        return;
      }

      const eventListener: typeof handler = (event) => isMounted && handlerRef.current?.(event);
      window.addEventListener(eventName, eventListener, options || false);
      return () => window.removeEventListener(eventName, eventListener, options || false);
    },
    [eventName, disabled],
    true,
  );
};
