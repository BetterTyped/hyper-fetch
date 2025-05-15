import EventEmitter from "events";

import { AppEvents } from "managers";

export const getAppManagerEvents = (emitter: EventEmitter) => ({
  emitFocus: (): void => {
    emitter.emit(AppEvents.FOCUS);
  },
  emitBlur: (): void => {
    emitter.emit(AppEvents.BLUR);
  },
  emitOnline: (): void => {
    emitter.emit(AppEvents.ONLINE);
  },
  emitOffline: (): void => {
    emitter.emit(AppEvents.OFFLINE);
  },
  onFocus: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.FOCUS, callback);
    return () => emitter.removeListener(AppEvents.FOCUS, callback);
  },
  onBlur: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.BLUR, callback);
    return () => emitter.removeListener(AppEvents.BLUR, callback);
  },
  onOnline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.ONLINE, callback);
    return () => emitter.removeListener(AppEvents.ONLINE, callback);
  },
  onOffline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.OFFLINE, callback);
    return () => emitter.removeListener(AppEvents.OFFLINE, callback);
  },
});
