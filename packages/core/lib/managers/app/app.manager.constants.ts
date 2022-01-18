import { AppManagerOptionsType } from "managers";
import { onWindowEvent, onDocumentEvent } from "./app.manager.utils";

export const focusEventKey = "focus";
export const blurEventKey = "blur";
export const onlineEventKey = "online";
export const offlineEventKey = "offline";

export const appManagerInitialOptions: AppManagerOptionsType = {
  initiallyFocused: true,
  initiallyOnline: true,
  focusEvent: (setFocused) => {
    onDocumentEvent("visibilitychange", setFocused);
    onWindowEvent("focus", setFocused);
  },
  blurEvent: (setBlurred) => {
    onWindowEvent("blur", setBlurred);
  },
  onlineEvent: (setOnline) => {
    onWindowEvent("online", () => setOnline(true));
    onWindowEvent("offline", () => setOnline(false));
  },
};
