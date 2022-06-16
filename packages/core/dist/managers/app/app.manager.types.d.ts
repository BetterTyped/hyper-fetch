export declare type AppManagerOptionsType = {
    initiallyFocused?: boolean | (() => boolean | Promise<boolean>);
    initiallyOnline?: boolean | (() => boolean | Promise<boolean>);
    focusEvent?: (setFocused: (isFocused: boolean) => void) => void;
    onlineEvent?: (setOnline: (isOnline: boolean) => void) => void;
};
