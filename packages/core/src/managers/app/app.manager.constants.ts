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
  focusEvent: (setFocused) => {
    onDocumentEvent("visibilitychange", () => setFocused(true));
    onWindowEvent("focus", () => setFocused(true));
    onWindowEvent("blur", () => setFocused(false));
  },
  onlineEvent: (setOnline) => {
    onWindowEvent("online", () => setOnline(true));
    onWindowEvent("offline", () => setOnline(false));
  },
};
