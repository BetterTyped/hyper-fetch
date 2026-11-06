import type { AppManagerOptionsType } from "managers";
import type { RequiredKeys } from "types";

import { onWindowEvent, onDocumentEvent, isNavigatorOnline } from "./app.manager.utils";

export enum AppEvents {
  FOCUS = "focus",
  BLUR = "blur",
  ONLINE = "online",
  OFFLINE = "offline",
}

export const appManagerInitialOptions: RequiredKeys<AppManagerOptionsType> = {
  initiallyFocused: true,
  initiallyOnline: isNavigatorOnline,
  focusEvent: (setFocused) => {
    const unmountVisibility = onDocumentEvent("visibilitychange", () => setFocused(true));
    const unmountFocus = onWindowEvent("focus", () => setFocused(true));
    const unmountBlur = onWindowEvent("blur", () => setFocused(false));

    return () => {
      unmountVisibility();
      unmountFocus();
      unmountBlur();
    };
  },
  onlineEvent: (setOnline) => {
    const unmountOnline = onWindowEvent("online", () => setOnline(true));
    const unmountOffline = onWindowEvent("offline", () => setOnline(false));

    return () => {
      unmountOnline();
      unmountOffline();
    };
  },
};
