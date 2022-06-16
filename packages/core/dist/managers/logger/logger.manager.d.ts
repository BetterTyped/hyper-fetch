import { BuilderInstance } from "builder";
import { LoggerLevelType, LoggerOptionsType, LoggerType, LoggerMethodsType } from "managers";
/**
 * This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
 * We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
 * like Builder, Command etc. Which can give you better feedback on the logging itself.
 */
export declare class LoggerManager {
    private builder;
    private options?;
    logger: LoggerType;
    levels: LoggerLevelType[];
    constructor(builder: BuilderInstance, options?: LoggerOptionsType);
    setLevels: (levels: LoggerLevelType[]) => void;
    init: (module: string) => LoggerMethodsType;
}
