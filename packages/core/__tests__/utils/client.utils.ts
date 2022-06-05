import { fetchClient } from "client";
import { CommandInstance } from "command";
import { sleep } from ".";

export const createClient = (props?: {
  sleepTime?: number;
  callback: (command: CommandInstance, requestId: string) => void;
}) => {
  const { sleepTime, callback } = props || {};

  return async (command: CommandInstance, requestId: string) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(command, requestId);
    return fetchClient(command, requestId);
  };
};
