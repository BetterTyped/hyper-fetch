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
  private hasFocusUpdate = false;
  private hasOnlineUpdate = false;

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

  private setInitialFocus = (initValue: Exclude<AppManagerOptionsType["initiallyFocused"], undefined>) => {
    this.isFocused = this.readInitialValue(initValue, (isFocused) => {
      // The environment could report the state in the meantime - it is more recent than the initial value
      if (!this.hasFocusUpdate && isFocused !== this.isFocused) {
        this.setFocused(isFocused);
      }
    });
  };

  private setInitialOnline = (initValue: Exclude<AppManagerOptionsType["initiallyOnline"], undefined>) => {
    this.isOnline = this.readInitialValue(initValue, (isOnline) => {
      // The environment could report the state in the meantime - it is more recent than the initial value
      if (!this.hasOnlineUpdate && isOnline !== this.isOnline) {
        this.setOnline(isOnline);
      }
    });
  };

  /**
   * Reads the initial state from a value or a getter. Synchronous getters apply right away, so there is no moment
   * with a wrong value. Asynchronous ones start with `false` and apply once resolved - the change is emitted like
   * any other, so the modules waiting for the focus or the network get notified.
   * A getter which throws or rejects leaves the state unknown, so it falls back to `true` - just like the defaults do.
   */
  private readInitialValue = (
    initValue: boolean | (() => boolean | Promise<boolean>),
    onResolved: (value: boolean) => void,
  ): boolean => {
    if (typeof initValue !== "function") {
      return initValue;
    }

    try {
      const value = initValue();
      if (typeof value === "boolean") {
        return value;
      }

      Promise.resolve(value).then(
        (resolved) => onResolved(resolved),
        () => onResolved(true),
      );
      return false;
    } catch {
      return true;
    }
  };

  setFocused = (isFocused: boolean) => {
    this.hasFocusUpdate = true;
    this.isFocused = isFocused;

    if (isFocused) {
      this.events.emitFocus();
    } else {
      this.events.emitBlur();
    }
  };

  setOnline = (isOnline: boolean) => {
    this.hasOnlineUpdate = true;
    this.isOnline = isOnline;

    if (isOnline) {
      this.events.emitOnline();
    } else {
      this.events.emitOffline();
    }
  };
}
