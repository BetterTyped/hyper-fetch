import EventEmitter from "events";

import { BuilderInstance } from "builder";
import { appManagerInitialOptions, AppManagerOptionsType, getAppManagerEvents } from "managers";

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

  isOnline: boolean;
  isFocused: boolean;

  constructor(private builder: BuilderInstance, private options?: AppManagerOptionsType) {
    const {
      focusEvent = appManagerInitialOptions.focusEvent,
      onlineEvent = appManagerInitialOptions.onlineEvent,
      initiallyFocused = appManagerInitialOptions.initiallyFocused,
      initiallyOnline = appManagerInitialOptions.initiallyOnline,
    } = this.options || appManagerInitialOptions;

    this.setInitialFocus(initiallyFocused);
    this.setInitialOnline(initiallyOnline);

    focusEvent(this.setFocused, builder);
    onlineEvent(this.setOnline, builder);
  }

  private setInitialFocus = async (initValue: Exclude<AppManagerOptionsType["initiallyFocused"], undefined>) => {
    if (typeof initValue === "function") {
      this.isFocused = false;
      this.isFocused = await initValue();
    } else {
      this.isFocused = initValue;
    }
  };

  private setInitialOnline = async (initValue: Exclude<AppManagerOptionsType["initiallyOnline"], undefined>) => {
    if (typeof initValue === "function") {
      this.isOnline = false;
      this.isOnline = await initValue();
    } else {
      this.isOnline = initValue;
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
