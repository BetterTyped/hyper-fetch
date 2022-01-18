export type AppManagerOptionsType = {
  initiallyFocused: boolean;
  initiallyOnline: boolean;
  focusEvent: (setFocused: () => void) => void;
  blurEvent: (setBlurred: () => void) => void;
  onlineEvent: (setOnline: (isOnline: boolean) => void) => void;
};
