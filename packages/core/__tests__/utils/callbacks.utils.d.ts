import { ClientResponseType } from "client";
import { CommandInstance } from "command";
export declare const interceptorCallback: (props?: {
  sleepTime?: number;
  callback: () => void;
}) => (response?: ClientResponseType<null, null>) => Promise<ClientResponseType<null, null>>;
export declare const middlewareCallback: (props?: {
  sleepTime?: number;
  callback: () => void;
}) => (command: CommandInstance) => Promise<CommandInstance>;
