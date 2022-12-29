import { Dispatcher, DispatcherOptionsType } from "dispatcher";
import { ClientInstance } from "client";

export const createDispatcher = (client: ClientInstance, options?: DispatcherOptionsType) => {
  return new Dispatcher(client, options);
};
