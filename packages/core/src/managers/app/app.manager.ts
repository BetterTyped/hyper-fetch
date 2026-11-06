import type { AppManagerOptionsType } from "managers";
import { appManagerInitialOptions, getAppManagerEvents, hasDocument } from "managers";
import { EventEmitter } from "utils";

/**
 * App manager handles main application states - focus and online. Those two values can answer questions:
 * - Is the tab or current view instance focused and visible for user?
 * - Is our application online or offline?
 * With the app manager it is not a problem to get the valid answer for this question.
 *
 * @caution
 * Make sure to apply valid focus/online handlers for different environments like for example for native mobile applications.
 */
export class AppManager {
  emitter = new EventEmitter();
  events = getAppManagerEvents(this.emitter);

  isBrowser: boolean;
  isOnline: boolean;
  isFocused: boolean;

  private unmountCallbacks: VoidFunction[] = [];

  constructor(public options?: AppManagerOptionsType) {
    this.emitter?.setMaxListeners(1000);
    const {
      initiallyFocused = appManagerInitialOptions.initiallyFocused,
      initiallyOnline = appManagerInitialOptions.initiallyOnline,
    } = this.options || appManagerInitialOptions;

    this.setInitialFocus(initiallyFocused);
    this.setInitialOnline(initiallyOnline);

    this.isBrowser = hasDocument();
  }

  /**
   * Subscribes to the environment focus and network changes. Calling it again replaces the previous subscriptions,
   * so the listeners are never registered twice.
   */
  initialize = () => {
    const { focusEvent = appManagerInitialOptions.focusEvent, onlineEvent = appManagerInitialOptions.onlineEvent } =
      this.options || appManagerInitialOptions;

    this.unmount();

    [focusEvent(this.setFocused), onlineEvent(this.setOnline)].forEach((unmount) => {
      if (typeof unmount === "function") {
        this.unmountCallbacks.push(unmount);
      }
    });
  };

  /**
   * Removes the environment listeners registered by `initialize()`. Listeners added with `events` are kept.
   */
  unmount = () => {
    const callbacks = this.unmountCallbacks;
    this.unmountCallbacks = [];
    callbacks.forEach((unmount) => unmount());
  };

  private setInitialFocus = async (initValue: Exclude<AppManagerOptionsType["initiallyFocused"], undefined>) => {
    if (typeof initValue !== "function") {
      this.isFocused = initValue;
      return;
    }

    // Synchronous getters apply right away, so there is no moment with a wrong value
    const value = initValue();
    if (typeof value === "boolean") {
      this.isFocused = value;
    } else {
      this.isFocused = false;
      this.isFocused = await value;
    }
  };

  private setInitialOnline = async (initValue: Exclude<AppManagerOptionsType["initiallyOnline"], undefined>) => {
    if (typeof initValue !== "function") {
      this.isOnline = initValue;
      return;
    }

    // Synchronous getters apply right away, so there is no moment with a wrong value
    const value = initValue();
    if (typeof value === "boolean") {
      this.isOnline = value;
    } else {
      this.isOnline = false;
      this.isOnline = await value;
    }
  };

  setFocused = (isFocused: boolean) => {
    this.isFocused = isFocused;

    if (isFocused) {
      this.events.emitFocus();
    } else {
      this.events.emitBlur();
    }
  };

  setOnline = (isOnline: boolean) => {
    this.isOnline = isOnline;

    if (isOnline) {
      this.events.emitOnline();
    } else {
      this.events.emitOffline();
    }
  };
}
