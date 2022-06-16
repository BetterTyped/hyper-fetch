export declare const useAppManager: <B extends Builder<any, any>>(builder: B) => {
    isOnline: any;
    isFocused: any;
    setOnline: (isOnline: boolean) => void;
    setFocused: (isFocused: boolean) => void;
};
