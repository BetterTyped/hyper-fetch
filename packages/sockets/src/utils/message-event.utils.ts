import { parseResponse } from "@hyper-fetch/core";

export const parseMessageEvent = <T extends { topic: string; data: any; event: any }>(event: MessageEvent<any>) => {
  const parsedEvent = parseResponse(event.data) as T;
  return { ...parsedEvent, event };
};
