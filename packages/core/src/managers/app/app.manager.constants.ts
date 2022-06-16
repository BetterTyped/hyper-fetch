import { RequiredKeys } from "types";
import { AppManagerOptionsType } from "managers";
import { onWindowEvent, onDocumentEvent } from "./app.manager.utils";

export enum AppEvents {
  focus = "focus",
  blur = "blur",
  online = "online",
  offline = "offline",
}

export const appManagerInitialOptions: RequiredKeys<AppManagerOptionsType> = {
  initiallyFocused: true,
  initiallyOnline: true,
  focusEvent: (setFocused: (isFocused: boolean) => void) => {
    onDocumentEvent("visibilitychange", () => setFocused(true));
    onWindowEvent("focus", () => setFocused(true));
    onWindowEvent("blur", () => setFocused(false));
  },
  onlineEvent: (setOnline: (isOnline: boolean) => void) => {
    onWindowEvent("online", () => setOnline(true));
    onWindowEvent("offline", () => setOnline(false));
  },
};
