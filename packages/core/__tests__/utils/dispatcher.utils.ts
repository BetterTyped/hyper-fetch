import type { DispatcherOptionsType } from "dispatcher";
import { Dispatcher } from "dispatcher";
import type { ClientInstance } from "client";

export const createDispatcher = (client: ClientInstance, options?: DispatcherOptionsType) => {
  return new Dispatcher(options).initialize(client);
};
