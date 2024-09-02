import { ClientInstance } from "@hyper-fetch/core";
import { EventEmitter } from "events";

// PoC
export function addOnCreateRequestEvent(client: ClientInstance) {
  const eventEmitter = new EventEmitter();
  // TODO remove
  process.env.NODE_ENV = "development";
  // eslint-disable-next-line no-param-reassign
  client.createRequest = new Proxy(client.createRequest, {
    apply(target, thisArg, args) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new Proxy(target.apply(thisArg, args), {
        apply(nestedTarget, nestedThisArg, nestedArgs) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const resultingRequest = nestedTarget.apply(nestedThisArg, nestedArgs);
          eventEmitter.emit("request_created", [client.__requestsMap.values()]);
          return resultingRequest;
        },
      });
    },
  });
  return eventEmitter;
}
