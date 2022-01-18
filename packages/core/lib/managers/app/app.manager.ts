import EventEmitter from "events";

import { appManagerInitialOptions, AppManagerOptionsType, getAppManagerEvents } from "managers";

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
