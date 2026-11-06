export type AppManagerOptionsType = {
  initiallyFocused?: boolean | (() => boolean | Promise<boolean>);
  initiallyOnline?: boolean | (() => boolean | Promise<boolean>);
  /**
   * Subscribes to the environment focus changes. Return a cleanup function to let `unmount()` remove the listeners.
   */
  focusEvent?: (setFocused: (isFocused: boolean) => void) => void | VoidFunction;
  /**
   * Subscribes to the environment network changes. Return a cleanup function to let `unmount()` remove the listeners.
   */
  onlineEvent?: (setOnline: (isOnline: boolean) => void) => void | VoidFunction;
};
