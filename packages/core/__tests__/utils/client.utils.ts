import { fetchClient } from "client";
import { FetchCommandInstance } from "command";
import { sleep } from ".";

export const createClient = (props?: {
  sleepTime?: number;
  callback: (command: FetchCommandInstance, requestId: string) => void;
}) => {
  const { sleepTime, callback } = props || {};

  return async (command: FetchCommandInstance, requestId: string) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(command, requestId);
    return fetchClient(command, requestId);
  };
};
