import { ClientInstance } from "@hyper-fetch/core";
import { EventEmitter } from "events";

import { EmitableCustomEvents } from "./devtools.types";

/***
 The idea of these hooks is to add events and functionalities that are applicable only for devtools.\
 ***/

// This function allows to hook on every request creation, returning a special request map for our explorer
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
          eventEmitter.emit(EmitableCustomEvents.REQUEST_CREATED, [...client.__requestsMap]);
          return resultingRequest;
        },
      });
    },
  });
  return eventEmitter;
}
