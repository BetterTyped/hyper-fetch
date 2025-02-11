import Emitter from "events";

const getListenName = (event: string | symbol) => `listen_${String(event)}`;

export class EventEmitter extends Emitter {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options?: ConstructorParameters<typeof Emitter>[0]) {
    super(options);
  }

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
