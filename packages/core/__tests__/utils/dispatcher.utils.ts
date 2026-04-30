import type { ClientInstance } from "client";
import type { DispatcherOptionsType } from "dispatcher";
import { Dispatcher } from "dispatcher";

export const createDispatcher = (client: ClientInstance, options?: DispatcherOptionsType) => {
  return new Dispatcher(options).initialize(client);
};
