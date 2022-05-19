import EventEmitter from "events";

import { appManagerInitialOptions, AppManagerOptionsType, getAppManagerEvents, LoggerMethodsType } from "managers";
import { FetchBuilder } from "builder";

/**
 * App manager handles main application states - focus and online. Those two values can answer questions:
 * - Is the tab or current view instance focused and visible for user?
 * - Is our application online or offline?
 * With the app manager it is not a problem to get the valid answer for this question.
 *
 * @caution
 * Make sure to apply valid focus/online handlers for different environments like for example for native mobile applications.
 */
export class AppManager<ErrorType, HttpOptions> {
  emitter = new EventEmitter();
  events = getAppManagerEvents(this.emitter);

  isOnline: boolean;
  isFocused: boolean;

  private logger: LoggerMethodsType;

  constructor(private builder: FetchBuilder<ErrorType, HttpOptions>, private options?: AppManagerOptionsType) {
    const {
      focusEvent = appManagerInitialOptions.focusEvent,
      onlineEvent = appManagerInitialOptions.onlineEvent,
      initiallyFocused = appManagerInitialOptions.initiallyFocused,
      initiallyOnline = appManagerInitialOptions.initiallyOnline,
    } = this.options || appManagerInitialOptions;

    this.logger = this.builder.loggerManager.init("AppManager");

    this.setInitialFocus(initiallyFocused);
    this.setInitialOnline(initiallyOnline);

    focusEvent(this.setFocused);
    onlineEvent(this.setOnline);
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

    this.logger.info(`Setting app to ${isFocused ? "Focused" : "Blurred"} state`, {
      isFocused,
      isOnline: this.isOnline,
    });

    if (isFocused) {
      this.events.emitFocus();
    } else {
      this.events.emitBlur();
    }
  };

  setOnline = (isOnline: boolean) => {
    this.isOnline = isOnline;

    this.logger.info(`Setting app to ${isOnline ? "Online" : "Offline"} state`, {
      isOnline,
      isFocused: this.isFocused,
    });

    if (isOnline) {
      this.events.emitOnline();
    } else {
      this.events.emitOffline();
    }
  };
}
