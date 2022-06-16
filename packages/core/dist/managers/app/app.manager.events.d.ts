import EventEmitter from "events";
export declare const getAppManagerEvents: (emitter: EventEmitter) => {
    emitFocus: () => void;
    emitBlur: () => void;
    emitOnline: () => void;
    emitOffline: () => void;
    onFocus: (callback: () => void) => VoidFunction;
    onBlur: (callback: () => void) => VoidFunction;
    onOnline: (callback: () => void) => VoidFunction;
    onOffline: (callback: () => void) => VoidFunction;
};
