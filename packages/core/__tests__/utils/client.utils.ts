import { fetchClient } from "client";
import { FetchCommandInstance } from "command";
import { sleep } from ".";

export const createClient = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (command: FetchCommandInstance, requestId: string) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return fetchClient(command, requestId);
  };
};
