import { browserClient, ClientType } from "client";

export const fetchClient: ClientType = async (command, requestId) => {
  if (command.builder.appManager.isNodeJs) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use Hyper Fetch built-in client.");
  } else {
    return browserClient(command, requestId);
  }
};
