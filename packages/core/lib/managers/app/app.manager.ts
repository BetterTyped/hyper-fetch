import EventEmitter from "events";

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

  constructor(options?: AppManagerOptionsType) {
    const { focusEvent, blurEvent, onlineEvent, initiallyFocused, initiallyOnline } =
      options || appManagerInitialOptions;

    this.isFocused = initiallyFocused;
    this.isOnline = initiallyOnline;

    focusEvent(() => this.setFocused(true));
    blurEvent(() => this.setFocused(false));
    onlineEvent(this.setOnline);
  }

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
