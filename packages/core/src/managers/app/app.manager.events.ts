import type EventEmitter from "events";

import { AppEvents } from "managers";

/** Create event emitters and listeners for application-level focus, blur, online, and offline state changes. */
export const getAppManagerEvents = (emitter: EventEmitter) => ({
  /** Emit when the application window gains focus */
  emitFocus: (): void => {
    emitter.emit(AppEvents.FOCUS);
  },
  /** Emit when the application window loses focus */
  emitBlur: (): void => {
    emitter.emit(AppEvents.BLUR);
  },
  /** Emit when the application transitions to online state */
  emitOnline: (): void => {
    emitter.emit(AppEvents.ONLINE);
  },
  /** Emit when the application transitions to offline state */
  emitOffline: (): void => {
    emitter.emit(AppEvents.OFFLINE);
  },
  /** Listen for focus events */
  onFocus: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.FOCUS, callback);
    return () => emitter.removeListener(AppEvents.FOCUS, callback);
  },
  /** Listen for blur events */
  onBlur: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.BLUR, callback);
    return () => emitter.removeListener(AppEvents.BLUR, callback);
  },
  /** Listen for online state transitions */
  onOnline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.ONLINE, callback);
    return () => emitter.removeListener(AppEvents.ONLINE, callback);
  },
  /** Listen for offline state transitions */
  onOffline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.OFFLINE, callback);
    return () => emitter.removeListener(AppEvents.OFFLINE, callback);
  },
});
