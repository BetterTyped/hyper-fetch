/// <reference types="node" />
import EventEmitter from "events";
import { BuilderInstance } from "builder";
import { AppManagerOptionsType } from "managers";
/**
 * App manager handles main application states - focus and online. Those two values can answer questions:
 * - Is the tab or current view instance focused and visible for user?
 * - Is our application online or offline?
 * With the app manager it is not a problem to get the valid answer for this question.
 *
 * @caution
 * Make sure to apply valid focus/online handlers for different environments like for example for native mobile applications.
 */
export declare class AppManager {
    private builder;
    private options?;
    emitter: EventEmitter;
    events: {
        emitFocus: () => void;
        emitBlur: () => void;
        emitOnline: () => void;
        emitOffline: () => void;
        onFocus: (callback: () => void) => VoidFunction;
        onBlur: (callback: () => void) => VoidFunction;
        onOnline: (callback: () => void) => VoidFunction;
        onOffline: (callback: () => void) => VoidFunction;
    };
    isOnline: boolean;
    isFocused: boolean;
    constructor(builder: BuilderInstance, options?: AppManagerOptionsType);
    private setInitialFocus;
    private setInitialOnline;
    setFocused: (isFocused: boolean) => void;
    setOnline: (isOnline: boolean) => void;
}
