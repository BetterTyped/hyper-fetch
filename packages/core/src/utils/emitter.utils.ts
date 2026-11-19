import Emitter from "events";

import { runUserCode } from "./error.utils";

const getListenName = (event: string | symbol) => `listen_${String(event)}`;

export class EventEmitter extends Emitter {
  emitCallbacks: ((event: string, data: any, isTriggeredExternally?: true) => void)[] = [];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options?: ConstructorParameters<typeof Emitter>[0]) {
    super(options);
  }

  emit(type: string, data: any, isTriggeredExternally: boolean) {
    const params: [string, any, true?] = [type, data];

    if (isTriggeredExternally) {
      params.push(isTriggeredExternally);
    }

    this.emitCallbacks?.forEach((callback) => runUserCode(() => callback(...params)));

    // Every listener gets the event - a throwing one can't keep it from the listeners added after it
    const listeners = this.rawListeners(type);
    listeners.forEach((listener) => runUserCode(() => listener.call(this, ...params.slice(1))));

    return listeners.length > 0;
  }

  onEmit = (callback: (event: string, data: any, isTriggeredExternally?: true) => void) => {
    this.emitCallbacks?.push(callback);
    return () => {
      this.emitCallbacks = this.emitCallbacks?.filter((cb) => cb !== callback);
    };
  };

  onListener = (event: string, listener: (count: number) => void) => {
    super.on(getListenName(event), listener);
    return () => {
      super.off(getListenName(event), listener);
    };
  };

  on = (event: string | symbol, listener: (...args: any[]) => void) => {
    super.on(event, listener);
    super.emit(getListenName(event), super.listeners(event).length);
    return this;
  };

  off = (event: string | symbol, listener: (...args: any[]) => void) => {
    super.off(event, listener);
    super.emit(getListenName(event), super.listeners(event).length);
    return this;
  };

  addListener = this.on;
  removeListener = this.off;
}
