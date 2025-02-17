import { parseResponse } from "@hyper-fetch/core";

import { SocketEvent } from "adapter";

export const parseMessageEvent = <T extends SocketEvent>(event: MessageEvent<any>) => {
  const parsedEvent = parseResponse(event.data) as T;
  return { ...parsedEvent, event };
};
