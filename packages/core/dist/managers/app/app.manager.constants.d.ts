import { RequiredKeys } from "types";
import { AppManagerOptionsType } from "managers";
export declare enum AppEvents {
    focus = "focus",
    blur = "blur",
    online = "online",
    offline = "offline"
}
export declare const appManagerInitialOptions: RequiredKeys<AppManagerOptionsType>;
