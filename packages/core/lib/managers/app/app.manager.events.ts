import EventEmitter from "events";
import { AppEvents } from "managers";

export const getAppManagerEvents = (emitter: EventEmitter) => ({
  emitFocus: (): void => {
    emitter.emit(AppEvents.focus);
  },
  emitBlur: (): void => {
    emitter.emit(AppEvents.blur);
  },
  emitOnline: (): void => {
    emitter.emit(AppEvents.online);
  },
  emitOffline: (): void => {
    emitter.emit(AppEvents.offline);
  },
  onFocus: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.focus, callback);
    return () => emitter.removeListener(AppEvents.focus, callback);
  },
  onBlur: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.blur, callback);
    return () => emitter.removeListener(AppEvents.blur, callback);
  },
  onOnline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.online, callback);
    return () => emitter.removeListener(AppEvents.online, callback);
  },
  onOffline: (callback: () => void): VoidFunction => {
    emitter.on(AppEvents.offline, callback);
    return () => emitter.removeListener(AppEvents.offline, callback);
  },
  umount: <T extends (...args: any[]) => void>(key: string, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
