import { Dispatcher, DispatcherOptionsType } from "dispatcher";
import { FetchBuilderInstance } from "builder";

export const createDispatcher = (builder: FetchBuilderInstance, options?: DispatcherOptionsType<unknown, unknown>) => {
  return new Dispatcher(builder, options);
};
