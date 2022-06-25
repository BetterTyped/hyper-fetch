import { BuilderInstance } from "builder";

export type AppManagerOptionsType = {
  initiallyFocused?: boolean | (() => boolean | Promise<boolean>);
  initiallyOnline?: boolean | (() => boolean | Promise<boolean>);
  focusEvent?: (setFocused: (isFocused: boolean) => void, builder: BuilderInstance) => void;
  onlineEvent?: (setOnline: (isOnline: boolean) => void, builder: BuilderInstance) => void;
};
