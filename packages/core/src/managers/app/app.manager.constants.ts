import type { AppManagerOptionsType } from "managers";
import type { RequiredKeys } from "types";

import { onWindowEvent, onDocumentEvent, isNavigatorOnline } from "./app.manager.utils";

/** Document is visible unless the browser reports it as hidden - when the state is unknown we assume it is visible */
const isDocumentVisible = () => {
  try {
    return window.document.visibilityState !== "hidden";
  } catch {
    /* istanbul ignore next */
    return true;
  }
};

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
    // Visibility changes in both directions - hidden document means the application lost the focus
    const unmountVisibility = onDocumentEvent("visibilitychange", () => setFocused(isDocumentVisible()));
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
