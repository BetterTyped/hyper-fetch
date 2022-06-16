export declare type LoggerMethodsType = Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>;
export declare type LoggerType = (log: LogType) => void;
export declare type LoggerOptionsType = {
    logger?: LoggerType;
    levels?: LoggerLevelType[];
};
export declare type LogType = {
    module: string;
    level: LoggerLevelType;
    message: LoggerMessageType;
    additionalData?: LoggerMessageType[];
};
export declare type LoggerLevelType = "success" | "error" | "warning" | "http" | "info" | "debug";
export declare type LoggerMessageType = string | Record<string, unknown> | Array<unknown>;
