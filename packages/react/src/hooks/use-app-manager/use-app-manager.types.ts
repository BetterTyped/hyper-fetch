export type UseAppManagerReturnType = {
  /**
   * Is window focused
   */
  isFocused: boolean;
  /**
   * Network online status
   */
  isOnline: boolean;
  /**
   * Network state setter
   */
  setOnline: (isOnline: boolean) => void;
  /**
   * Focus state setter
   */
  setFocused: (isFocused: boolean) => void;
};
