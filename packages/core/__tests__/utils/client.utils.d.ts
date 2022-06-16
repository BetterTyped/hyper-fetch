import { CommandInstance } from "command";
export declare const createClient: (props?: {
  sleepTime?: number;
  callback: (command: CommandInstance, requestId: string) => void;
}) => (command: CommandInstance, requestId: string) => Promise<import("client").ClientResponseType<any, any>>;
