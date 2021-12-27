import EventEmitter from "events";

import { managerInitialOptions, ManagerOptionsType, getManagerEvents } from "manager";

export class Manager {
  emitter = new EventEmitter();
  events = getManagerEvents(this.emitter);

  isOnline: boolean;
  isFocused: boolean;

  constructor(options?: ManagerOptionsType) {
    const { focusEvent, blurEvent, onlineEvent, initiallyFocused, initiallyOnline } = options || managerInitialOptions;

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
