import { BuilderInstance } from "builder";
import { CommandConfig } from "command";
import { ClientDefaultOptionsType } from "client";
export declare const createCommand: <T extends BuilderInstance>(
  builder: T,
  options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>,
) => import("command").Command<any, any, string, any, undefined, string, any, false, false, false, undefined>;
