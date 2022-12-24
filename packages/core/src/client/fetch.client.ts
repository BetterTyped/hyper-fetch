import { browserClient, ClientType } from "client";
import { serverClient } from "./fetch.client.server";

export const fetchClient: ClientType = async (command, requestId) => {
  if (command.builder.appManager.isNodeJs || !window?.XMLHttpRequest) {
    return serverClient(command, requestId);
  }
  return browserClient(command, requestId);
};
