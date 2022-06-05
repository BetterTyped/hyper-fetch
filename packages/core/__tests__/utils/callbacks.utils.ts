import { ClientResponseType } from "client";
import { CommandInstance } from "command";
import { sleep } from "./helpers.utils";

export const interceptorCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (response?: ClientResponseType<null, null>): Promise<ClientResponseType<null, null>> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return response || [null, null, 200];
  };
};

export const middlewareCallback = (props?: { sleepTime?: number; callback: () => void }) => {
  const { sleepTime, callback } = props || {};

  return async (command: CommandInstance): Promise<CommandInstance> => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.();
    return command;
  };
};
