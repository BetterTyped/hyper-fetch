import EventEmitter from "events";
import { blurEventKey, focusEventKey, offlineEventKey, onlineEventKey } from "manager";

export const getManagerEvents = (emitter: EventEmitter) => ({
  emitFocus: (): void => {
    emitter.emit(focusEventKey);
  },
  emitBlur: (): void => {
    emitter.emit(blurEventKey);
  },
  emitOnline: (): void => {
    emitter.emit(onlineEventKey);
  },
  emitOffline: (): void => {
    emitter.emit(offlineEventKey);
  },
  onFocus: (callback: () => void): VoidFunction => {
    emitter.on(focusEventKey, callback);
    return () => emitter.removeListener(focusEventKey, callback);
  },
  onBlur: (callback: () => void): VoidFunction => {
    emitter.on(blurEventKey, callback);
    return () => emitter.removeListener(blurEventKey, callback);
  },
  onOnline: (callback: () => void): VoidFunction => {
    emitter.on(onlineEventKey, callback);
    return () => emitter.removeListener(onlineEventKey, callback);
  },
  onOffline: (callback: () => void): VoidFunction => {
    emitter.on(offlineEventKey, callback);
    return () => emitter.removeListener(offlineEventKey, callback);
  },
  umount: <T extends (...args: any[]) => void>(key: string, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
